import { faker } from '@faker-js/faker';
import { APIUserData, UIUserFormData, UiRole } from '../../models/user';
import { DEFAULT_PASSWORD } from '../../constants/common';
import { Roles } from '../../constants/roles';
import { Status } from '../../constants/status';

type InternalRole = UiRole;

export class UserBuilder {
    private username: string;
    private password: string;
    private name: string;
    private role: InternalRole;
    private enabled: boolean;
    private empNumber: number;

    constructor() {
        const uniqueSuffix = `${Date.now()}${faker.number.int({ min: 100, max: 999 })}`;

        this.username = `user_${uniqueSuffix}`;
        this.password = DEFAULT_PASSWORD;
        this.name = faker.person.fullName();
        this.role = 'Admin';
        this.enabled = true;
        this.empNumber = faker.number.int({ min: 1000, max: 9999 });
    }

    withUsername(username: string): this {
        this.username = username;
        return this;
    }

    withPassword(password: string): this {
        this.password = password;
        return this;
    }

    withName(name: string): this {
        this.name = name;
        return this;
    }

    withRole(role: UiRole): this {
        this.role = role;
        return this;
    }

    withEmpNumber(empNumber: number): this {
        this.empNumber = empNumber;
        return this;
    }

    asAdmin(): this {
        this.role = 'Admin';
        return this;
    }

    asEss(): this {
        this.role = 'ESS';
        return this;
    }

    enabledUser(): this {
        this.enabled = true;
        return this;
    }

    disabledUser(): this {
        this.enabled = false;
        return this;
    }

    buildForUi(): UIUserFormData {
        return {
            username: this.username,
            password: this.password,
            confirmPassword: this.password,
            role: this.role,
            name: 'Qui  Ngo',
            status: this.enabled ? 'Enabled' : 'Disabled',
        };
    }

    buildForApi(): APIUserData {
        return {
            username: this.username,
            password: this.password,
            empNumber: this.empNumber,
            userRoleId: this.mapRoleToApiId(this.role),
            status: this.mapStatusToApiStatus(this.enabled ? 'Enabled' : 'Disabled'),
        };
    }

    private mapRoleToApiId(role: InternalRole): number {
        const match = Object.values(Roles).find((r) => r.label === role);
        if (!match) {
            throw new Error(`Unknown role: ${role}`);
        }

        return Number(match.code);
    }

    private mapStatusToApiStatus(status: 'Enabled' | 'Disabled'): boolean {
        const match = Object.values(Status).find((s) => s.label === status);
        if (!match) {
            throw new Error(`Unknown status: ${status}`);
        }

        return match.code;
    }
}
