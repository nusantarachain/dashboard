// Copyright 2017-2021 @polkadot/apps-routing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { TFunction } from 'i18next';
import type { Route } from './types';

import Component, { useCounter } from '@polkadot/app-organizations';

export default function create (t: TFunction): Route {
  return {
    Component,
    display: {
      needsApi: [
        "query.organization.organizations"
      ]
    },
    group: 'accounts',
    icon: 'users',
    name: 'organizations',
    text: t('nav.organizations', 'Organization', { ns: 'apps-organizations' }),
    useCounter
  };
}
