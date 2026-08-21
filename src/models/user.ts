export type UiRole = 'Admin' | 'ESS';
export type UiStatus = 'Enabled' | 'Disabled';

export interface UserCredentials {
    username: string;
    password: string;
}

export interface UIUserFormData extends UserCredentials {
    confirmPassword: string;
    role: UiRole;
    name: string;
    status: UiStatus;
}

export interface APIUserData extends UserCredentials {
    empNumber: number;
    userRoleId: number;
    status: boolean;
}
