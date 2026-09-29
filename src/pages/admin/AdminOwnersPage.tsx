import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  KeyRound,
  Building2,
  Trash2
} from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { UserProfile, Business } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export const AdminOwnersPage: React.FC = () => {
  const toast = useToast();
  const [owners, setOwners] = useState<UserProfile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Owner Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [assignedBusinessId, setAssignedBusinessId] = useState('');
  const [ownerToDelete, setOwnerToDelete] = useState<UserProfile | null>(null);
  const [deletingOwnerId, setDeletingOwnerId] = useState<string | null>(null);

  const loadData = async () => {
    const [ownerRows, businessRows] = await Promise.all([
      databaseService.getProfiles('owner'),
      databaseService.getBusinesses(),
    ]);
    setOwners(ownerRows);
    setBusinesses(businessRows);
  };

  useEffect(() => {
    void loadData().catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not load owners.'));
  }, []);

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    try {
      const created = await databaseService.createOwner({
        name: newName,
        email: newEmail,
        phone: newPhone,
        password: tempPassword || undefined,
        businessId: assignedBusinessId || undefined,
      });
      toast.success(`Owner account created for ${created.name}. Invitation sent if no temporary password was provided.`);
      setIsModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setTempPassword('');
      setAssignedBusinessId('');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create owner account.');
    }
  };

  const handleToggleStatus = async (ownerId: string) => {
    try {
      const updated = await databaseService.toggleOwnerStatus(ownerId);
      toast.success(`Account for ${updated.name} is now ${updated.status}.`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update owner status.');
    }
  };

  const handleDeleteOwner = async () => {
    if (!ownerToDelete || deletingOwnerId) return;
    const target = ownerToDelete;
    setDeletingOwnerId(target.id);
    try {
      const result = await databaseService.deleteOwner(target.id);
      setOwnerToDelete(null);
      toast.success(result.auditWarning
        ? `${target.name} was deleted. ${result.auditWarning}`
        : `${target.name} and the linked Auth account were deleted.`);
      await loadData().catch((error: unknown) => {
        toast.error(`Owner was deleted, but the list could not refresh: ${error instanceof Error ? error.message : 'Unknown error.'}`);
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete owner account.');
    } finally {
      setDeletingOwnerId(null);
    }
  };

  const handleResetPassword = async (owner: UserProfile) => {
    try {
      await databaseService.sendOwnerPasswordReset(owner.email);
      toast.success(`Password reset email sent to ${owner.email}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send password reset email.');
    }
  };

  const filteredOwners = owners.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Owner Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision, monitor, disable, or reset business owner credentials
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Owner
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search owners by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="py-1.5 text-xs"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {filteredOwners.length} {filteredOwners.length === 1 ? 'owner' : 'owners'} found
        </span>
      </div>

      {/* Owners Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-5">Owner</th>
                <th className="py-3.5 px-5">Assigned Venue</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Created</th>
                <th className="py-3.5 px-5">Last Login</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOwners.map((owner) => {
                const assignedBiz = businesses.find((b) => b.owner_id === owner.id);
                return (
                  <tr key={owner.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {owner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{owner.name}</p>
                          <p className="text-slate-400 text-[11px]">{owner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {assignedBiz ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{assignedBiz.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <Badge variant={owner.status === 'active' ? 'success' : 'destructive'} size="sm">
                        {owner.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-slate-500">
                      {new Date(owner.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-5 text-slate-500">
                      {owner.last_login
                        ? new Date(owner.last_login).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Never'}
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleResetPassword(owner)}
                        disabled={deletingOwnerId !== null}
                        className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Send Password Reset"
                      >
                        <KeyRound className="w-3.5 h-3.5 inline" />
                      </button>
                      <Button
                        variant={owner.status === 'active' ? 'destructive' : 'subtle'}
                        size="sm"
                        onClick={() => handleToggleStatus(owner.id)}
                        disabled={deletingOwnerId !== null}
                        className="text-[11px] py-1 h-7"
                      >
                        {owner.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => setOwnerToDelete(owner)}
                        disabled={deletingOwnerId !== null}
                        className="text-[11px] py-1 h-7"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Owner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Business Owner"
        description="Provision an authenticated account and assign an initial venue."
      >
        <form onSubmit={handleCreateOwner} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john@venue.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 234-5678"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />

          <Input
            label="Temporary Password"
            type="password"
            placeholder="Auto-generated if left blank"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            helperText="Never shown in UI again after creation."
          />

          <Select
            label="Assign Venue (Optional)"
            value={assignedBusinessId}
            onChange={(e) => setAssignedBusinessId(e.target.value)}
            options={[
              { value: '', label: 'Select venue to assign...' },
              ...businesses.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Provision Owner Account
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={ownerToDelete !== null}
        onClose={() => {
          if (!deletingOwnerId) setOwnerToDelete(null);
        }}
        title="Delete Business Owner"
        description="This permanently deletes the owner's Supabase Auth account and profile."
      >
        {ownerToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Delete <span className="font-semibold">{ownerToDelete.name}</span> ({ownerToDelete.email})?
              Owners with assigned businesses cannot be deleted. Reassign or delete those businesses first.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOwnerToDelete(null)}
                disabled={deletingOwnerId !== null}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                isLoading={deletingOwnerId === ownerToDelete.id}
                onClick={() => void handleDeleteOwner()}
              >
                Delete Owner
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
