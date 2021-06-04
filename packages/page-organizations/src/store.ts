// [object Object]
// SPDX-License-Identifier: Apache-2.0

import EventEmitter from 'eventemitter3';
import store from 'store';

import { OrgStored } from './types';

const KEY_PREFIX = 'org:';

class Store extends EventEmitter {
  private allOrganizations: Record<string, OrgStored> = {};

  public getAllOrganizations (): OrgStored[] {
    return Object.values(this.allOrganizations);
  }

  public async save (org: OrgStored) {
    const key = `${KEY_PREFIX}${org.id}`;

    store.set(key, org);
    this.add(key, org);
  }

  public forget (id: string) {
    const key = `${KEY_PREFIX}${id}`;

    this.remove(key);
  }

  public async loadAll (): Promise<void> {
    try {
      store.each((data: OrgStored, key: string): void => {
        if (key.startsWith(KEY_PREFIX)) {
          this.add(key, data);
        }
      });
    } catch (error) {
      console.error('Unable to load all organizations data', error);
    }
  }

  private add (key: string, org: OrgStored) {
    try {
      this.allOrganizations[key.substring(KEY_PREFIX.length)] = org;
      this.emit('new-org');
    } catch (error) {
      console.error(error);
      this.remove(key);
    }
  }

  private remove (key: string) {
    try {
      delete this.allOrganizations[key.substring(KEY_PREFIX.length)];
      store.remove(key);
      this.emit('remove-org');
    } catch (error) {
      console.error(error);
    }
  }
}

export default new Store();
