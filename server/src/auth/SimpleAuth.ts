import User from '../client/User';
import Auth from './Auth';
import restClient from '../restClient';
import { handleError } from '../Api';

interface BearitSuccessResponse<T> {
  status: 'OK',
  data: T
}

interface TokenResponse {
  id: string,
  username: string
}

export default class SimpleAuth implements Auth {
  // eslint-disable-next-line class-methods-use-this
  async authenticate(token: string): Promise<User> {
    try {
      const connectedUser = await restClient.get<BearitSuccessResponse<TokenResponse>>(`user-from-token?token=${token}`)
        .then((response) => response.data)
        .then((data) => data.data);

      return new User(connectedUser.id);
    } catch (e) {
      handleError(e);
      throw e;
    }
  }
}
