import User from '../client/User';

export default interface Auth {
  authenticate(token: string): Promise<User>;
}
