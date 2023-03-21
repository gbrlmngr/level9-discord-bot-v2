import { get } from 'env-var';

export const DATABASE_URL = get('DATABASE_URL').required().asUrlString();
