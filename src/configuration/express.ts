import { get } from 'env-var';

export const EXPRESS_PORT = get('EXPRESS_PORT').required().asPortNumber();
