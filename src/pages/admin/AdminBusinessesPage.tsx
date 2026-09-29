import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { Business, UserProfile } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export const AdminBusinessesPage: React.FC = () => {
  const toast = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [owners, setOwners] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Business Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bar & Restaurant');
  const [ownerId, setOwnerId] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  const loadData = async () => {
    const [businessRows, ownerRows] = await Promise.all([
      databaseService.getBusinesses(),
      databaseService.getProfiles('owner'),
    ]);
    setBusinesses(businessRows);
    setOwners(ownerRows);
  };

  useEffect(() => {
    void loadData().catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not load businesses.'));
  }, []);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !googleReviewUrl.trim()) {
      toast.error('Venue name and Google Review URL are mandatory.');
      return;
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const assignedOwnerId = ownerId || owners[0]?.id;
    if (!assignedOwnerId) {
      toast.error('Create an owner account before adding a venue.');
      return;
    }
    try {
      const newBiz = await databaseService.createBusiness({
        owner_id: assignedOwnerId,
        name,
        slug: `${slug}-${crypto.randomUUID().slice(0, 5)}`,
        logo_url: logoUrl || undefined,
        description,
        category,
        address,
        phone,
        website,
        google_review_url: googleReviewUrl,
        status: 'active',
      });
      toast.success(`Business "${newBiz.name}" created with QR slug: /review/${newBiz.slug}`);
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setAddress('');
      setPhone('');
      setWebsite('');
      setGoogleReviewUrl('');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create business.');
    }
  };

  const handleToggleStatus = async (bizId: string) => {
    try {
      const updated = await databaseService.toggleBusinessStatus(bizId);
      if (!updated) return;
      toast.success(`Venue "${updated.name}" is now ${updated.status}.`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update business status.');
    }
  };

  const handleDeleteBusiness = async () => {
    if (!businessToDelete || deletingBusinessId) return;
    const target = businessToDelete;
    setDeletingBusinessId(target.id);
    try {
      const result = await databaseService.deleteBusiness(target.id);
      setBusinessToDelete(null);
      toast.success(result.auditWarning
        ? `${target.name} was deleted. ${result.auditWarning}`
        : `Business "${target.name}" and its dependent records were deleted.`);
      await loadData().catch((error: unknown) => {
        toast.error(`Business was deleted, but the list could not refresh: ${error instanceof Error ? error.message : 'Unknown error.'}`);
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete business.');
    } finally {
      setDeletingBusinessId(null);
    }
  };

  const filtered = businesses.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Venue Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision client venues, verify Google review destinations, and manage QR endpoints
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Venue
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search venues by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="py-1.5 text-xs"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {filtered.length} {filtered.length === 1 ? 'venue' : 'venues'}
        </span>
      </div>

      {/* Businesses Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-5">Venue</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Owner</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Created</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((biz) => {
                const owner = owners.find((o) => o.id === biz.owner_id);
                return (
                  <tr key={biz.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {biz.logo_url ? (
                          <img
                            src={biz.logo_url}
                            alt={biz.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {biz.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{biz.name}</p>
                          <a
                            href={`${import.meta.env.BASE_URL}review/${encodeURIComponent(biz.slug)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                          >
                            <span>/review/{biz.slug}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-600">{biz.category}</td>
                    <td className="py-4 px-5 text-slate-700 font-medium">
                      {owner?.name || 'Assigned'}
                    </td>
                    <td className="py-4 px-5">
                      <Badge variant={biz.status === 'active' ? 'success' : 'destructive'} size="sm">
                        {biz.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-slate-500">
                      {new Date(biz.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <Button
                        variant={biz.status === 'active' ? 'destructive' : 'subtle'}
                        size="sm"
                        onClick={() => handleToggleStatus(biz.id)}
                        disabled={deletingBusinessId !== null}
                        className="text-[11px] py-1 h-7"
                      >
                        {biz.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => setBusinessToDelete(biz)}
                        disabled={deletingBusinessId !== null}
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

      {/* Create Business Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Venue"
        description="Configure a new venue profile and auto-generate its QR review flow."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBusiness} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Venue Name"
              placeholder="e.g. Skyline Rooftop Lounge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Bar & Restaurant', label: 'Bar & Restaurant' },
                { value: 'Cafe & Bakery', label: 'Cafe & Bakery' },
                { value: 'Hotel & Hospitality', label: 'Hotel & Hospitality' },
                { value: 'Salon & Spa', label: 'Salon & Spa' },
                { value: 'Clinic & Medical', label: 'Clinic & Medical' },
                { value: 'Retail Store', label: 'Retail Store' },
                { value: 'Gym & Fitness', label: 'Gym & Fitness' },
                { value: 'Services & Trades', label: 'Services & Trades' },
              ]}
            />
          </div>

          <Select
            label="Assign Venue Owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            options={[
              { value: '', label: 'Select registered owner...' },
              ...owners.map((o) => ({ value: o.id, label: `${o.name} (${o.email})` })),
            ]}
          />

          <Input
            label="Google Business Review URL"
            placeholder="https://search.google.com/local/writereview?placeid=..."
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            helperText="The URL patrons are forwarded to after copying their AI review."
            required
          />

          <Input
            label="Logo Image URL (Optional)"
            placeholder="https://images.unsplash.com/..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />

          <Textarea
            label="Venue Description"
            placeholder="Brief atmosphere or specialties note..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Address"
              placeholder="123 Main St, New York, NY"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

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
              Create Venue & Generate QR
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={businessToDelete !== null}
        onClose={() => {
          if (!deletingBusinessId) setBusinessToDelete(null);
        }}
        title="Delete Business"
        description="This permanently removes the venue and its dependent records."
      >
        {businessToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Delete <span className="font-semibold">{businessToDelete.name}</span>? Its review sessions, reviews,
              analytics events, and AI generation records will also be deleted. The owner account will remain.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBusinessToDelete(null)}
                disabled={deletingBusinessId !== null}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                isLoading={deletingBusinessId === businessToDelete.id}
                onClick={() => void handleDeleteBusiness()}
              >
                Delete Business
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
