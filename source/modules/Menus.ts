import { MenuMiddleware } from 'telegraf-inline-menu';
import { menu } from '@/menu';

export const menuInstance = new MenuMiddleware('/', menu);