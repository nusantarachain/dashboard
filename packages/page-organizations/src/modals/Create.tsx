// Copyright 2017-2021 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ActionStatus } from '@polkadot/react-components/Status/types';
import type { CreateResult } from '@polkadot/ui-keyring/types';
import type { ModalProps } from '../types';
import type {ApiPromise} from '@polkadot/api';
import { EventRecord, ExtrinsicStatus } from '@polkadot/types/interfaces';

import FileSaver from 'file-saver';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import { DEV_PHRASE } from '@polkadot/keyring/defaults';
import { getEnvironment } from '@polkadot/react-api/util';
import { AddressRow, Button, Checkbox, CopyButton, Dropdown, Expander, Input, InputAddress, InputAddressSimple, MarkError, MarkWarning, Modal, TextArea, TxButton } from '@polkadot/react-components';
import { useApi, useLedger, useStepper } from '@polkadot/react-hooks';
import { keyring } from '@polkadot/ui-keyring';
import { settings } from '@polkadot/ui-settings';
import { isHex, u8aToHex } from '@polkadot/util';
import { hdLedger, hdValidatePath, keyExtractSuri, mnemonicGenerate, mnemonicValidate, randomAsU8a } from '@polkadot/util-crypto';

import { useTranslation } from '../translate';
import CreateConfirmation from './CreateConfirmation';

import store from '../store';

const ETH_DEFAULT_PATH = "m/44'/60'/0'/0/0";

type PairType = 'ecdsa' | 'ed25519' | 'ed25519-ledger' | 'ethereum' | 'sr25519';

interface Props extends ModalProps {
  className?: string;
  onClose: () => void;
  onStatusChange: (status: ActionStatus) => void;
  seed?: string;
  type?: PairType;
}

type SeedType = 'bip' | 'raw' | 'dev';

interface AddressState {
  address: string | null;
  derivePath: string;
  deriveValidation?: DeriveValidationOutput
  isSeedValid: boolean;
  pairType: PairType;
  seed: string;
  seedType: SeedType;
}

interface CreateOptions {
  genesisHash?: string;
  name: string;
  tags?: string[];
}

interface DeriveValidationOutput {
  error?: string;
  warning?: string;
}

const DEFAULT_PAIR_TYPE = 'sr25519';
const STEPS_COUNT = 3;

function getSuri (seed: string, derivePath: string, pairType: PairType): string {
  return pairType === 'ed25519-ledger'
    ? u8aToHex(hdLedger(seed, derivePath).secretKey.slice(0, 32))
    : pairType === 'ethereum'
      ? `${seed}/${derivePath}`
      : `${seed}${derivePath}`;
}

function deriveValidate (seed: string, seedType: SeedType, derivePath: string, pairType: PairType): DeriveValidationOutput {
  try {
    const { password, path } = keyExtractSuri(pairType === 'ethereum' ? `${seed}/${derivePath}` : `${seed}${derivePath}`);
    let result: DeriveValidationOutput = {};

    // show a warning in case the password contains an unintended / character
    if (password?.includes('/')) {
      result = { warning: 'WARNING_SLASH_PASSWORD' };
    }

    // we don't allow soft for ed25519
    if (pairType === 'ed25519' && path.some(({ isSoft }): boolean => isSoft)) {
      return { ...result, error: 'SOFT_NOT_ALLOWED' };
    }

    // we don't allow password for hex seed
    if (seedType === 'raw' && password) {
      return { ...result, error: 'PASSWORD_IGNORED' };
    }

    if (pairType === 'ethereum' && !hdValidatePath(derivePath)) {
      return { ...result, error: 'INVALID_DERIVATION_PATH' };
    }

    return result;
  } catch (error) {
    return { error: (error as Error).message };
  }
}

function isHexSeed (seed: string): boolean {
  return isHex(seed) && seed.length === 66;
}

function rawValidate (seed: string): boolean {
  return ((seed.length > 0) && (seed.length <= 32)) || isHexSeed(seed);
}

function addressFromSeed (seed: string, derivePath: string, pairType: PairType): string {
  return keyring
    .createFromUri(getSuri(seed, derivePath, pairType), {}, pairType === 'ed25519-ledger' ? 'ed25519' : pairType)
    .address;
}

function newSeed (seed: string | undefined | null, seedType: SeedType): string {
  switch (seedType) {
    case 'bip':
      return mnemonicGenerate();
    case 'dev':
      return DEV_PHRASE;
    default:
      return seed || u8aToHex(randomAsU8a());
  }
}

function generateSeed (_seed: string | undefined | null, derivePath: string, seedType: SeedType, pairType: PairType = DEFAULT_PAIR_TYPE): AddressState {
  const seed = newSeed(_seed, seedType);
  const address = addressFromSeed(seed, derivePath, pairType);

  return {
    address,
    derivePath,
    deriveValidation: undefined,
    isSeedValid: true,
    pairType,
    seed,
    seedType
  };
}

function updateAddress (seed: string, derivePath: string, seedType: SeedType, pairType: PairType): AddressState {
  let address: string | null = null;
  let deriveValidation: DeriveValidationOutput = deriveValidate(seed, seedType, derivePath, pairType);
  let isSeedValid = seedType === 'raw'
    ? rawValidate(seed)
    : mnemonicValidate(seed);

  if (!deriveValidation?.error && isSeedValid) {
    try {
      address = addressFromSeed(seed, derivePath, pairType);
    } catch (error) {
      console.error(error);
      deriveValidation = { error: (error as Error).message ? (error as Error).message : (error as Error).toString() };
      isSeedValid = false;
    }
  }

  return {
    address,
    derivePath,
    deriveValidation,
    isSeedValid,
    pairType,
    seed,
    seedType
  };
}

export function downloadAccount ({ json, pair }: CreateResult): void {
  const blob = new Blob([JSON.stringify(json)], { type: 'application/json; charset=utf-8' });

  FileSaver.saveAs(blob, `${pair.address}.json`);
}

interface Property {
  key: string;
  value: string;
}

// function createAccount (seed: string, derivePath: string, pairType: PairType, { genesisHash, name, tags = [] }: CreateOptions, password: string, success: string): ActionStatus {
function createOrganization (api: ApiPromise, name: string, description: string, 
    admin: string, website: string, email: string, props: Property[] | null, senderId: string): ActionStatus {
  // we will fill in all the details below
  const status = { action: 'create' } as ActionStatus;

  try {
    // const result = keyring.addUri(getSuri(seed, derivePath, pairType), password, { genesisHash, isHardware: false, name, tags }, pairType === 'ed25519-ledger' ? 'ed25519' : pairType);
    // const { address } = result.pair;

    // status.account = address;
    // status.status = 'success';
    // status.message = success;

    // InputAddress.setLastValue('account', address);

    // if (getEnvironment() === 'web') {
    //   downloadAccount(result);
    // }

    api.tx.organization.create(name, description, admin, website, email, props)
      .paymentInfo(senderId)
      .then((data): void => {
        console.log(data)
      }).catch(error => {console.error((error as Error).message)});

  } catch (error) {
    status.status = 'error';
    status.message = (error as Error).message;
  }

  return status;
}

function Create ({ className = '', onClose, onStatusChange, seed: propsSeed, type: propsType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { api, isDevelopment, isEthereum } = useApi();
  const { isLedgerEnabled } = useLedger();
  // const [{ address, derivePath, deriveValidation, isSeedValid, pairType, seed, seedType }, setAddress] = useState<AddressState>(() => generateSeed(
  //   propsSeed,
  //   isEthereum ? ETH_DEFAULT_PATH : '',
  //   propsSeed ? 'raw' : 'bip', isEthereum ? 'ethereum' : propsType
  // ));

  const [isMnemonicSaved, setIsMnemonicSaved] = useState<boolean>(false);
  const [step, nextStep, prevStep] = useStepper();
  const [isBusy, setIsBusy] = useState(false);
  const [{ isNameValid, name }, setName] = useState({ isNameValid: false, name: '' });
  const [{ description, isDescriptionValid }, setDescription] = useState({ isDescriptionValid: false, description: '' });
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [adminAddress, setAdminAddress] = useState<string | null>("");
  // const [{ isPasswordValid, password }, setPassword] = useState({ isPasswordValid: false, password: '' });
  const isFirstStepValid = isNameValid && isDescriptionValid;
  // const isSecondStepValid = isNameValid && isPasswordValid;
  const isValid = isFirstStepValid;
  // const isDescriptionValid = description.trim().length > 0;

  const errorIndex = useRef<Record<string, string>>({
    INVALID_DERIVATION_PATH: t<string>('This is an invalid derivation path.'),
    PASSWORD_IGNORED: t<string>('Password are ignored for hex seed'),
    SOFT_NOT_ALLOWED: t<string>('Soft derivation paths are not allowed on ed25519'),
    WARNING_SLASH_PASSWORD: t<string>('Your password contains at least one "/" character. Disregard this warning if it is intended.')
  });

  const seedOpt = useRef((
    isDevelopment
      ? [{ text: t<string>('Development'), value: 'dev' }]
      : []
  ).concat(
    { text: t<string>('Mnemonic'), value: 'bip' },
    isEthereum
      ? { text: t<string>('Private Key'), value: 'raw' }
      : { text: t<string>('Raw seed'), value: 'raw' }
  ));

  // const _onChangePath = useCallback(
  //   (newDerivePath: string) => setAddress(
  //     updateAddress(seed, newDerivePath, seedType, pairType)
  //   ),
  //   [pairType, seed, seedType]
  // );

  // const _onChangeSeed = useCallback(
  //   (newSeed: string) => setAddress(
  //     updateAddress(newSeed, derivePath, seedType, pairType)
  //   ),
  //   [derivePath, pairType, seedType]
  // );

  // const _onChangePairType = useCallback(
  //   (newPairType: PairType) => setAddress(
  //     updateAddress(seed, isEthereum ? ETH_DEFAULT_PATH : '', seedType, newPairType)
  //   ),
  //   [seed, seedType, isEthereum]
  // );

  // const _selectSeedType = useCallback(
  //   (newSeedType: SeedType): void => {
  //     if (newSeedType !== seedType) {
  //       setAddress(generateSeed(null, derivePath, newSeedType, pairType));
  //     }
  //   },
  //   [derivePath, pairType, seedType]
  // );

  const _onChangeName = useCallback(
    (name: string) => setName({ isNameValid: !!name.trim(), name }),
    []
  );

  const _onChangeDescription = useCallback((description: string) => setDescription({ isDescriptionValid: !!description.trim(), description }), []);

  // const _onPasswordChange = useCallback(
  //   (password: string, isPasswordValid: boolean) => setPassword({ isPasswordValid, password }),
  //   []
  // );

  // const _toggleMnemonicSaved = () => {
  //   setIsMnemonicSaved(!isMnemonicSaved);
  // };

  // const _onCommit = useCallback(
  //   (): void => {
  //     if (!isValid) {
  //       return;
  //     }

  //     setIsBusy(true);
  //     setTimeout((): void => {
  //       // const props:Property[] = [];
  //       // const status = createOrganization(api, name, description, adminAddress!, website, 
  //       //   email, props, adminAddress!);

  //       // onStatusChange(status);
  //       setIsBusy(false);
  //       onClose();
  //     }, 0);
  //   },
  //   // [api, derivePath, isDevelopment, isValid, name, onClose, onStatusChange, pairType, password, seed, t]
  //   [api, isValid, onClose, t]
  // );

  const _onSuccess = useCallback(
    ({ events = [], status }: {events?: EventRecord[], status: ExtrinsicStatus; }): void => {
      console.log(status)
      if (status.isInBlock) {
        events.forEach(({event: {data, section, method}}) => {
          const eventName = `${section}.${method}`;
          console.log(eventName)
          if (eventName === "organization.OrganizationAdded"){
            const [orgId, _creatorId] = data.toHuman() as string[];
            api.query.organization.organizations(orgId).then((data: any) => {
              const org = data.toHuman()
              console.log("🚀 ~ file: Create.tsx ~ line 337 ~ api.query.organization.organizations ~ org", org)
              store.save(org)
            })
          }
        });
      }
    },
    [api]
  )

  return (
    <Modal
      className={className}
      header={t<string>('Register new organization {{step}}/{{STEPS_COUNT}}', { replace: { STEPS_COUNT, step } })}
      size='large'
    >
      <Modal.Content>
        {step === 1 && <>
          <Modal.Columns>
            <Input autoFocus
              help={t<string>('Organization name')}
              isError={!isNameValid}
              label={t<string>('name')}
              onChange={_onChangeName} />
          </Modal.Columns>
          <Modal.Columns>
            <TextArea
              help={t<string>('The description that describe about the organization')}
              isError={!isDescriptionValid}
              // isReadOnly={seedType === 'dev'}
              label={
                t<string>('description')
              }
              onChange={_onChangeDescription}
            >
            </TextArea>
          </Modal.Columns>
          <Modal.Columns>
            <InputAddress
              help={t<string>("organization's admin address")}
              label={t<string>('admin')}
              placeholder={t<string>('admin address')}
              onChange={setAdminAddress}
             />
          </Modal.Columns>
          <Modal.Columns>
          <Input
              help={t<string>('Website')}
              label={t<string>('website')}
              onChange={setWebsite} />
          </Modal.Columns>
          <Modal.Columns>
          <Input
              help={t<string>('Email')}
              label={t<string>('email')}
              onChange={setEmail} />
          </Modal.Columns>
        </>}
      </Modal.Content>
      <Modal.Actions onCancel={onClose}>
        {step === 1 && (
          <>
            <TxButton
            accountId={adminAddress}
            isDisabled={!isValid}
            label={t<string>('Create')}
            onStart={onClose}
            onSuccess={_onSuccess}
            icon='paper-plane'
            params={
              [name, description, adminAddress, website, email, []]
            }
            tx={api.tx.organization.create}
             />
          </>
        )}
      </Modal.Actions>
    </Modal>
  );
}

export default React.memo(styled(Create)`
  .accounts--Creator-advanced {
    margin-top: 1rem;
    overflow: visible;
  }

  .ui--CopyButton.copyMoved {
    position: absolute;
    right: 9.25rem;
    top: 1.15rem;
  }

  && .TextAreaWithDropdown {
    textarea {
      width: 80%;
    }
    .ui.buttons {
      width: 20%;
    }
  }

  .saveToggle {
    text-align: right;

    .ui--Checkbox {
      margin: 0.8rem 0;

      > label {
        font-weight: var(--font-weight-normal);
      }
    }
  }
`);
