import { Principal } from '@dfinity/principal';
import { atom } from 'nanostores';

export interface IUser {
    principal: Principal,
}

export const $user = atom<IUser | null>(null);
export function setUser(user: IUser) {
    $user.set(user);
}

