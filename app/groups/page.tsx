// import { fetchGroups } from '@/lib/groupApi';
import GroupCreate from '@/components/pages/groups/GroupCreate';
import GroupOverview from '@/components/pages/dashboard/GroupOverview';
import Navbar from '@/components/layout/Navbar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/configs/auth/authOptions';

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <p className="text-center mt-10 text-red-500">You must be logged in to view this page.</p>;
  }
  // @ts-ignore
  const userId = session.user?.id || '';
  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 space-y-8">
        <GroupCreate />
        <GroupOverview userId={userId} />
      </div>
    </div>
  );
}
