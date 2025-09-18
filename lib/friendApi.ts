import axios from 'axios';

export async function fetchFriends() {
  const res = await axios.get('/api/friends');
  return res.status === 200 ? res.data : [];
}
