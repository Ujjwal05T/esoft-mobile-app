import {useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {getStaffProfile, type StaffPermissions} from '../services/api';

// Whether the signed-in user holds a staff permission: true for owners, null until a staff member's
// permissions have been fetched. If the fetch fails this is true, as the server still refuses
// anything the staff member is not permitted to do.
export function useStaffPermission(key: keyof StaffPermissions): boolean | null {
  const {user} = useAuth();
  const isStaff = user?.role === 'staff';
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isStaff) {
      setAllowed(true);
      return;
    }
    let cancelled = false;
    getStaffProfile().then(res => {
      if (cancelled) return;
      setAllowed(res.success ? !!res.data?.permissions[key] : true);
    });
    return () => {
      cancelled = true;
    };
  }, [isStaff, key]);

  return allowed;
}
