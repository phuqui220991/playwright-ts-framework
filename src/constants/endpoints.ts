export const Endpoints = {
    users: {
        base: '/users',
        byId: (id: string) => `/users/${id}`,
        me: '/users/me',
    },

    products: {
        base: '/products',
        byId: (id: string) => `/products/${id}`,
    },

    orders: {
        base: '/orders',
        byId: (id: string) => `/orders/${id}`,
    },
} as const;
