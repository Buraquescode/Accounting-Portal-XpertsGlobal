// User lookups for the screens. (Kept as a service so controllers never call repositories directly.)
import * as userRepository from '../repositories/user.repository.js';

export const listApprovers = () => userRepository.findApprovers();
