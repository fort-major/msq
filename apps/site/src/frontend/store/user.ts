import { Principal } from '@dfinity/principal'
import { atom } from 'nanostores'
import { IState } from '@fort-major/masquerade-shared';

export interface IUser {
    principal: Principal,
    state: IState,
}

export const $user = atom<IUser | null>(null);
export function setUser(user: IUser) {
    $user.set(user);
}

