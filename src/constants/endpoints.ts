export const Endpoints = {
    users: {
        base: '/users',
        byId: (id: string) => `/users/${id}`,
        me: '/users/me',
    },
} as const;
