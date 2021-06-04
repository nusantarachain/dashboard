// Copyright 2017-2021 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ActionStatus } from '@polkadot/react-components/Status/types';
import type { OrgStored } from '../types';

import BN from 'bn.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { Button, Input, Table } from '@polkadot/react-components';
import { useLoadingDelay, useToggle } from '@polkadot/react-hooks';
import { FormatBalance } from '@polkadot/react-query';
import { BN_ZERO } from '@polkadot/util';

import CreateModal from '../modals/Create';
import ImportModal from '../modals/Import';
import store from '../store';
import { useTranslation } from '../translate';
import Organization from './Organization';

interface Balances {
  accounts: Record<string, BN>;
  balanceTotal?: BN;
}

interface Props {
  className?: string;
  onStatusChange: (status: ActionStatus) => void;
}

// const STORE_FAVS = 'accounts:favorites';

function Overview ({ className = '', onStatusChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isCreateOpen, toggleCreate] = useToggle();
  const [isImportOpen, toggleImport] = useToggle();
  // const [favorites, toggleFavorite] = useFavorites(STORE_FAVS);
  const [{ balanceTotal }, setBalances] = useState<Balances>({ accounts: {} });
  const [filterOn, setFilter] = useState<string>('');
  const [storedOrgs, setSorted] = useState<OrgStored[]>([]);
  const isLoading = useLoadingDelay();

  const headerRef = useRef([
    [t('organizations'), 'start', 3],
    [t('name'), 'start'],
    [t('description'), 'start'],
    // [t('tags'), 'start'],
    [t('transactions'), 'media--1500'],
    [t('funds'), 'expand', 2],
    // [],
    [undefined, 'media--1400']
  ]);

  useEffect((): void => {
    const triggerUpdate = () => {
      setSorted(store.getAllOrganizations());
    };

    store.loadAll().then(triggerUpdate);

    store.on('new-org', triggerUpdate);
    store.on('remove-org', triggerUpdate);
  }, [store]);

  const _setBalance = useCallback(
    (account: string, balance: BN) =>
      setBalances(({ accounts }: Balances): Balances => {
        accounts[account] = balance;

        return {
          accounts,
          balanceTotal: Object.values(accounts).reduce((total: BN, value: BN) => total.add(value), BN_ZERO)
        };
      }),
    []
  );

  const footer = useMemo(() => (
    <tr>
      <td colSpan={3} />
      <td className='media--1400' />
      <td colSpan={2} />
      <td className='media--1500' />
      <td className='number'>
        {balanceTotal && <FormatBalance value={balanceTotal} />}
      </td>
      <td />
      <td className='media--1400' />
    </tr>
  ), [balanceTotal]);

  const filter = useMemo(() => (
    <div className='filter--tags'>
      <Input
        autoFocus
        isFull
        label={t<string>('filter by name or tags')}
        onChange={setFilter}
        value={filterOn}
      />
    </div>
  ), [filterOn, t]);

  return (
    <div className={className}>
      {isCreateOpen && (
        <CreateModal
          onClose={toggleCreate}
          onStatusChange={onStatusChange}
        />
      )}
      {isImportOpen && (
        <ImportModal
          onClose={toggleImport}
          onStatusChange={onStatusChange}
        />
      )}
      <Button.Group>
        <Button
          icon='plus'
          label={t<string>('Register')}
          onClick={toggleCreate}
        />
      </Button.Group>
      <Table
        empty={!isLoading && storedOrgs && t<string>('No any organizations registered to your session.')}
        filter={filter}
        footer={footer}
        header={headerRef.current}
      >
        {!isLoading && storedOrgs?.map((org, index): React.ReactNode => (
          <Organization
            filter={filterOn}
            key={`${index}:${org.id}`}
            org={org}
            setBalance={_setBalance}
          />
        ))}
      </Table>
    </div>
  );
}

export default React.memo(styled(Overview)`
  .filter--tags {
    .ui--Dropdown {
      padding-left: 0;

      label {
        left: 1.55rem;
      }
    }
  }
`);
