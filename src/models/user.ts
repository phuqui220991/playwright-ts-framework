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

export interface AdminUserRecord {
    id: number;
    userName: string;
    deleted: boolean;
    status: boolean;
    employee: {
        empNumber: number;
        employeeId: string;
        firstName: string;
        middleName: string;
        lastName: string;
        terminationId: number | null;
    };
    userRole: {
        id: number;
        name: string;
        displayName: string;
    };
}

export interface AdminUserListResponse {
    data: AdminUserRecord[];
    meta: { total: number };
}

export interface AdminUserResponse {
    data: AdminUserRecord;
}

export interface AdminUserDeleteResponse {
    data: number[];
}
