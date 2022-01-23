import {createReactQueryHooks} from '@trpc/react';
import type {AppRouter} from '../api/router';

export const trpc = createReactQueryHooks<AppRouter>();
