import axios from 'axios';
import User from '../client/User';
import Auth from './Auth';

interface BearitSuccessResponse<T> {
  status: 'OK',
  data: T
}

interface TokenResponse {
  id: string,
  username: string
}

export default class SimpleAuth implements Auth {
  constructor(private baseUrl: string) {}

  async authenticate(token: string): Promise<User> {
    const connectedUser = await axios.get<BearitSuccessResponse<TokenResponse>>(`${this.baseUrl}/api/user-from-token?token=${token}`)
      .then((response) => response.data)
      .then((data) => data.data);

    return new User(connectedUser.id);
  }
}
