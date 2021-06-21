// Copyright 2017-2021 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0

// import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { ActionStatus } from '@polkadot/react-components/Status/types';
import type { ThemeDef } from '@polkadot/react-components/types';

import React, { useCallback, useContext, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { AddressInfo, AddressSmall, Badge, Button, ChainLock, Forget, Icon, LinkExternal, Menu, Popup } from '@polkadot/react-components';
import { useAccountInfo, useApi, useCall, useToggle } from '@polkadot/react-hooks';
import { BN_ZERO, formatNumber } from '@polkadot/util';

import Backup from '../modals/Backup';
import ChangePass from '../modals/ChangePass';
import Derive from '../modals/Derive';
import IdentityMain from '../modals/IdentityMain';
import IdentitySub from '../modals/IdentitySub';
import RecoverAccount from '../modals/RecoverAccount';
import RecoverSetup from '../modals/RecoverSetup';
import Transfer from '../modals/Transfer';
import UndelegateModal from '../modals/Undelegate';
import store from '../store';
import { useTranslation } from '../translate';
import { OrgStored } from '../types';
import { createMenuGroup } from '../util';

interface Props {
  org: OrgStored;
  className?: string;
  filter: string;
  isFavorite: boolean;
  // setBalance: (address: string, value: BN) => void;
  toggleFavorite: (address: string) => void;
}

// interface DemocracyUnlockable {
//   democracyUnlockTx: SubmittableExtrinsic<'promise'> | null;
//   ids: BN[];
// }

function calcVisible (filter: string, name: string, tags: string[]): boolean {
  if (filter.length === 0) {
    return true;
  }

  const _filter = filter.toLowerCase();

  return tags.reduce((result: boolean, tag: string): boolean => {
    return result || tag.toLowerCase().includes(_filter);
  }, name.toLowerCase().includes(_filter));
}

// function createClearDemocracyTx (api: ApiPromise, address: string, unlockableIds: BN[]): SubmittableExtrinsic<'promise'> | null {
//   return api.tx.utility
//     ? api.tx.utility.batch(
//       unlockableIds
//         .map((id) => api.tx.democracy.removeVote(id))
//         .concat(api.tx.democracy.unlock(address))
//     )
//     : null;
// }

// async function showLedgerAddress (getLedger: () => Ledger, meta: KeyringJson$Meta): Promise<void> {
//   const ledger = getLedger();

//   await ledger.getAddress(true, meta.accountOffset as number || 0, meta.addressOffset as number || 0);
// }

// const transformRecovery = {
//   transform: (opt: Option<RecoveryConfig>) => opt.unwrapOr(null)
// };

function Organization ({ className = '', filter, isFavorite, org: { description, id, name }, toggleFavorite }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const address = id;
  const { theme } = useContext<ThemeDef>(ThemeContext);
  // const { queueExtrinsic } = useContext(StatusContext);
  const api = useApi();
  // const { getLedger } = useLedger();
  // const bestNumber = useBestNumber();
  const balancesAll = useCall<DeriveBalancesAll>(api.api.derive.balances.all, [address]);
  // const democracyLocks = useCall<DeriveDemocracyLock[]>(api.api.derive.democracy?.locks, [address]);
  // const recoveryInfo = useCall<RecoveryConfig | null>(api.api.query.recovery?.recoverable, [address], transformRecovery);
  // const multiInfos = useMultisigApprovals(address);
  // const proxyInfo = useProxies(address);
  const { flags: { isDevelopment, isEditable, isExternal, isHardware, isInjected, isMultisig }, genesisHash, identity, name: accName, onSetGenesisHash, tags } = useAccountInfo(address);
  // const [{ democracyUnlockTx }, setUnlockableIds] = useState<DemocracyUnlockable>({ democracyUnlockTx: null, ids: [] });
  // const [vestingVestTx, setVestingTx] = useState<SubmittableExtrinsic<'promise'> | null>(null);
  const [isBackupOpen, toggleBackup] = useToggle();
  const [isDeriveOpen, toggleDerive] = useToggle();
  const [isForgetOpen, toggleForget] = useToggle();
  const [isIdentityMainOpen, toggleIdentityMain] = useToggle();
  const [isIdentitySubOpen, toggleIdentitySub] = useToggle();
  const [isPasswordOpen, togglePassword] = useToggle();
  const [isRecoverAccountOpen, toggleRecoverAccount] = useToggle();
  const [isRecoverSetupOpen, toggleRecoverSetup] = useToggle();
  const [isSettingsOpen, toggleSettings] = useToggle();
  const [isTransferOpen, toggleTransfer] = useToggle();
  const [isUndelegateOpen, toggleUndelegate] = useToggle();

  // useEffect((): void => {
  //   if (balancesAll) {
  //     setBalance(address, balancesAll.freeBalance.add(balancesAll.reservedBalance));

  //     api.api.tx.vesting?.vest && setVestingTx(() =>
  //       balancesAll.vestingLocked.isZero()
  //         ? null
  //         : api.api.tx.vesting.vest()
  //     );
  //   }
  // }, [address, api, balancesAll, setBalance]);

  // useEffect((): void => {
  //   bestNumber && democracyLocks && setUnlockableIds(
  //     (prev): DemocracyUnlockable => {
  //       const ids = democracyLocks
  //         .filter(({ isFinished, unlockAt }) => isFinished && bestNumber.gt(unlockAt))
  //         .map(({ referendumId }) => referendumId);

  //       if (JSON.stringify(prev.ids) === JSON.stringify(ids)) {
  //         return prev;
  //       }

  //       return {
  //         democracyUnlockTx: createClearDemocracyTx(api.api, address, ids),
  //         ids
  //       };
  //     }
  //   );
  // }, [address, api, bestNumber, democracyLocks]);

  const isVisible = useMemo(
    () => calcVisible(filter, accName, tags),
    [accName, filter, tags]
  );

  const _onFavorite = useCallback(
    () => toggleFavorite(address),
    [address, toggleFavorite]
  );

  const _onForget = useCallback(
    (): void => {
      if (!address) {
        return;
      }

      const status: Partial<ActionStatus> = {
        account: address,
        action: 'forget'
      };

      try {
        // keyring.forgetAccount(address);
        store.forget(address);
        status.status = 'success';
        status.message = t<string>('account forgotten');
      } catch (error) {
        status.status = 'error';
        status.message = (error as Error).message;
      }

      toggleForget();
    },
    [address, t]
  );

  // const _clearDemocracyLocks = useCallback(
  //   () => democracyUnlockTx && queueExtrinsic({
  //     accountId: address,
  //     extrinsic: democracyUnlockTx
  //   }),
  //   [address, democracyUnlockTx, queueExtrinsic]
  // );

  // const _vestingVest = useCallback(
  //   () => vestingVestTx && queueExtrinsic({
  //     accountId: address,
  //     extrinsic: vestingVestTx
  //   }),
  //   [address, queueExtrinsic, vestingVestTx]
  // );

  // const _showOnHardware = useCallback(
  //   // TODO: we should check the hardwareType from metadata here as well,
  //   // for now we are always assuming hardwareType === 'ledger'
  //   (): void => {
  //     showLedgerAddress(getLedger, meta).catch((error): void => {
  //       console.error(`ledger: ${(error as Error).message}`);
  //     });
  //   },
  //   [getLedger, meta]
  // );

  const menuItems = useMemo(() => [
    createMenuGroup('backupGroup', [
      // !(isExternal || isHardware || isInjected || isMultisig || isDevelopment) && (
      //   <Menu.Item
      //     key='backupJson'
      //     onClick={toggleBackup}
      //   >
      //     {t('Create a backup file for this account')}
      //   </Menu.Item>
      // ),
      !(isInjected || isDevelopment) && (
        <Menu.Item
          key='forgetAccount'
          onClick={toggleForget}
        >
          {t('Forget this account')}
        </Menu.Item>
      )
    ]),

    isEditable && !api.isDevelopment && createMenuGroup('genesisGroup', [
      <ChainLock
        className='accounts--network-toggle'
        genesisHash={genesisHash}
        key='chainlock'
        onChange={onSetGenesisHash}
      />
    ])
  ].filter((i) => i),
  [api, genesisHash, identity, isDevelopment, isEditable, isExternal, isHardware, isInjected, isMultisig, onSetGenesisHash, t, toggleBackup, toggleDerive, toggleForget, toggleIdentityMain, toggleIdentitySub, togglePassword, toggleRecoverAccount, toggleRecoverSetup, toggleUndelegate]);

  if (!isVisible) {
    return null;
  }

  return (
    <tr className={className}>
      <td className='favorite'>
        <Icon
          color={isFavorite ? 'orange' : 'gray'}
          icon='star'
          onClick={_onFavorite}
        />
      </td>
      <td className='together'>
        <Badge color='transparent' />
      </td>
      <td className='address'>
        <AddressSmall value={address} />
        {isBackupOpen && (
          <Backup
            address={address}
            key='modal-backup-account'
            onClose={toggleBackup}
          />
        )}
        {isDeriveOpen && (
          <Derive
            from={address}
            key='modal-derive-account'
            onClose={toggleDerive}
          />
        )}
        {isForgetOpen && (
          <Forget
            address={address}
            key='modal-forget-account'
            mode='org'
            onClose={toggleForget}
            onForget={_onForget}
          />
        )}
        {isIdentityMainOpen && (
          <IdentityMain
            address={address}
            key='modal-identity-main'
            onClose={toggleIdentityMain}
          />
        )}
        {isIdentitySubOpen && (
          <IdentitySub
            address={address}
            key='modal-identity-sub'
            onClose={toggleIdentitySub}
          />
        )}
        {isPasswordOpen && (
          <ChangePass
            address={address}
            key='modal-change-pass'
            onClose={togglePassword}
          />
        )}
        {isTransferOpen && (
          <Transfer
            key='modal-transfer'
            onClose={toggleTransfer}
            senderId={address}
          />
        )}
        {/* {isProxyOverviewOpen && (
          <ProxyOverview
            key='modal-proxy-overview'
            onClose={toggleProxyOverview}
            previousProxy={proxy}
            proxiedAccount={address}
          />
        )} */}
        {/* {isMultisigOpen && multiInfos && (
          <MultisigApprove
            address={address}
            key='multisig-approve'
            onClose={toggleMultisig}
            ongoing={multiInfos}
            threshold={meta.threshold as number}
            who={meta.who as string[]}
          />
        )} */}
        {isRecoverAccountOpen && (
          <RecoverAccount
            address={address}
            key='recover-account'
            onClose={toggleRecoverAccount}
          />
        )}
        {isRecoverSetupOpen && (
          <RecoverSetup
            address={address}
            key='recover-setup'
            onClose={toggleRecoverSetup}
          />
        )}
        {isUndelegateOpen && (
          <UndelegateModal
            accountDelegating={address}
            key='modal-delegate'
            onClose={toggleUndelegate}
          />
        )}
      </td>
      <td className='address'>
        <strong>{name}</strong>
      </td>
      <td className='address'>
        <p>{description}</p>
      </td>
      <td className='number media--1500'>
        {balancesAll?.accountNonce.gt(BN_ZERO) && formatNumber(balancesAll.accountNonce)}
      </td>
      <td className='number'>
        <AddressInfo
          address={address}
          withBalance
          withBalanceToggle
          withExtended={false}
        />
      </td>
      <td className='button'>
        {/* {isFunction(api.api.tx.balances?.transfer) && (
          <Button
            icon='paper-plane'
            label={t<string>('send')}
            onClick={toggleTransfer}
          />
        )} */}
        <Popup
          className={`theme--${theme}`}
          isOpen={isSettingsOpen}
          onClose={toggleSettings}
          trigger={
            <Button
              icon='ellipsis-v'
              isDisabled={!menuItems.length}
              onClick={toggleSettings}
            />
          }
        >
          <Menu
            onClick={toggleSettings}
            text
            vertical
          >
            {menuItems}
          </Menu>
        </Popup>
      </td>
      <td className='links media--1400'>
        <LinkExternal
          className='ui--AddressCard-exporer-link'
          data={address}
          isLogo
          type='address'
        />
      </td>
    </tr>
  );
}

export default React.memo(styled(Organization)`
  .tags {
    width: 100%;
    min-height: 1.5rem;
  }

  .devBadge {
    opacity: 0.65;
  }
`);
