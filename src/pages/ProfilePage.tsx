// src/pages/ProfilePage.tsx - COMPLETE WITH ALL FEATURES
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { User, Mail, Phone, MapPin, Building, Truck, Store, Edit2, Save, X, Camera, Eye, EyeOff, Download, Trash2 } from 'lucide-react';

interface UserProfile {
  id: number;
  auth_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'retailer' | 'wholesaler' | 'delivery_partner';
  created_at?: string;
  business_name?: string;
  gst_number?: string;
  license_number?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  profile_image?: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [changingPassword, setChangingPassword] = useState(false);
  const [orderStats, setOrderStats] = useState({ totalOrders: 0, totalSpent: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData(data);

      // Fetch order stats for customers
      if (data.role === 'customer') {
        console.log('=== FETCHING ORDER STATS ===');
        console.log('Customer auth_id:', user.id);
        
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, total_price, status')
          .eq('customer_id', user.id);
        
        console.log('Query result - Orders:', orders);
        console.log('Query result - Error:', ordersError);
        
        if (ordersError) {
          console.error('Failed to fetch orders:', ordersError.message);
        } else if (orders && orders.length > 0) {
          const totalSpent = orders.reduce((sum, o) => {
            const price = parseFloat(o.total_price) || 0;
            console.log('Order price:', o.total_price, '-> parsed:', price);
            return sum + price;
          }, 0);
          
          console.log('Final stats - Orders:', orders.length, 'Total:', totalSpent);
          setOrderStats({
            totalOrders: orders.length,
            totalSpent: totalSpent
          });
        } else {
          console.log('No orders found for this customer (empty array)');
        }
        console.log('=== END ORDER STATS ===');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.auth_id}-${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName);

      // Upload to Supabase Storage - directly to bucket root
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('auth_id', profile.auth_id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      setProfile({ ...profile, profile_image: publicUrl });
      setFormData({ ...formData, profile_image: publicUrl });
      alert('Profile image updated successfully!');
      
      // Refresh page to show new image
      window.location.reload();
    } catch (error: any) {
      console.error('Full upload error:', error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          business_name: formData.business_name,
          gst_number: formData.gst_number,
          license_number: formData.license_number,
          vehicle_type: formData.vehicle_type,
          vehicle_number: formData.vehicle_number,
        })
        .eq('auth_id', profile.auth_id);

      if (error) throw error;
      setProfile({ ...profile, ...formData });
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.new.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Password change error:', error);
      alert(`Failed to change password: ${error.message}`);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDownloadData = async () => {
    if (!profile) return;
    
    try {
      // Gather all user data
      const userData: any = { profile: { ...profile } };
      delete userData.profile.auth_id; // Don't include auth_id in export

      // Fetch orders if customer
      if (profile.role === 'customer') {
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', profile.auth_id);
        userData.orders = orders || [];

        const { data: queries } = await supabase
          .from('queries')
          .select('*')
          .eq('customer_id', profile.auth_id);
        userData.queries = queries || [];
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livemart-data-${profile.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Your data has been downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download data');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete your account?\n\nThis action is PERMANENT and cannot be undone. All your data will be lost.'
    );
    if (!confirmed) return;

    const doubleConfirm = window.prompt('Type "DELETE" to confirm account deletion:');
    if (doubleConfirm !== 'DELETE') {
      alert('Account deletion cancelled');
      return;
    }

    try {
      // Soft delete - mark as deleted
      await supabase
        .from('users')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('auth_id', profile?.auth_id);

      await supabase.auth.signOut();
      navigate('/');
      alert('Your account has been deleted');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete account');
    }
  };

  const getRoleIcon = () => {
    switch (profile?.role) {
      case 'customer': return <User className="w-6 h-6" />;
      case 'retailer': return <Store className="w-6 h-6" />;
      case 'wholesaler': return <Building className="w-6 h-6" />;
      case 'delivery_partner': return <Truck className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getRoleColor = () => {
    switch (profile?.role) {
      case 'customer': return 'from-[#4A9FBE] to-[#5AA5B0]';
      case 'retailer': return 'from-[#D97B7B] to-[#E59595]';
      case 'wholesaler': return 'from-[#5FA889] to-[#7DBFA0]';
      case 'delivery_partner': return 'from-[#D4A855] to-[#D97B7B]';
      default: return 'from-[#6B7A8F] to-[#4A5568]';
    }
  };

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'customer': return 'Customer';
      case 'retailer': return 'Retailer';
      case 'wholesaler': return 'Wholesaler';
      case 'delivery_partner': return 'Delivery Partner';
      default: return 'User';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDF2F7] dark:bg-[#1A2332] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A9FBE] dark:border-[#6BB3CF]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#EDF2F7] dark:bg-[#1A2332] flex items-center justify-center">
        <p className="text-[#6B7A8F] dark:text-[#8A99AA]">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:bg-gradient-to-br dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className={`bg-gradient-to-r ${getRoleColor()} rounded-2xl shadow-xl p-8 mb-6 text-white`}>
          <div className="flex items-center gap-6">
            {/* Avatar with Upload */}
            <div className="relative group">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden">
                {profile.profile_image && profile.profile_image.startsWith('http') ? (
                  <img 
                    src={profile.profile_image} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', profile.profile_image);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl font-bold">${profile.name?.charAt(0).toUpperCase()}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-4xl font-bold">{profile.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 bg-[#FAFBFC] dark:bg-[#242D3C] text-[#2C3847] dark:text-[#E5E9EF] p-2 rounded-full shadow-lg hover:bg-[#EDF2F7] dark:hover:bg-[#3A4555] transition-all opacity-0 group-hover:opacity-100"
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-[#6B7A8F] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Name & Role */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
              <div className="flex items-center gap-2 opacity-90">
                {getRoleIcon()}
                <span className="text-lg">{getRoleLabel()}</span>
              </div>
              <p className="text-sm opacity-75 mt-2">
                {formatDate(profile.created_at) 
                  ? `Member since ${formatDate(profile.created_at)}` 
                  : ''}
              </p>
            </div>

            {/* Edit Button */}
            {!editing ? (
              <button onClick={() => setEditing(true)} className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all">
                <Edit2 className="w-5 h-5" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="bg-[#FAFBFC] dark:bg-[#242D3C] text-[#5FA889] dark:text-[#B8E6D5] hover:bg-[#D9EDE5] dark:hover:bg-[#3A4555] px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50">
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setFormData(profile); }} className="bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#4A9FBE] dark:text-[#6BB3CF]" /> Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Full Name</label>
                {editing ? (
                  <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-[#D8DEE6] dark:border-[#3A4555] rounded-lg bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]" />
                ) : (
                  <p className="text-[#2C3847] dark:text-[#E5E9EF] font-medium">{profile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1"><Mail className="w-4 h-4 inline mr-1" />Email</label>
                <p className="text-[#2C3847] dark:text-[#E5E9EF]">{profile.email}</p>
                <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA]">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1"><Phone className="w-4 h-4 inline mr-1" />Phone</label>
                {editing ? (
                  <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone" className="w-full px-4 py-2 border border-[#D8DEE6] dark:border-[#3A4555] rounded-lg bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]" />
                ) : (
                  <p className="text-[#2C3847] dark:text-[#E5E9EF]">{profile.phone || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1"><MapPin className="w-4 h-4 inline mr-1" />Address</label>
                {editing ? (
                  <textarea value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Enter address" rows={2} className="w-full px-4 py-2 border border-[#D8DEE6] dark:border-[#3A4555] rounded-lg bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]" />
                ) : (
                  <p className="text-[#2C3847] dark:text-[#E5E9EF]">{profile.address || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role-Specific Info */}
          <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-4 flex items-center gap-2">{getRoleIcon()} {getRoleLabel()} Details</h2>
            <div className="space-y-4">
              {(profile.role === 'retailer' || profile.role === 'wholesaler') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Business Name</label>
                    {editing ? <input type="text" value={formData.business_name || ''} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} className="w-full px-4 py-2 border border-[#D8DEE6] dark:border-[#3A4555] rounded-lg bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF]" /> : <p className="text-[#2C3847] dark:text-[#E5E9EF]">{profile.business_name || 'Not provided'}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1">GST Number</label>
                    {editing ? <input type="text" value={formData.gst_number || ''} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} className="w-full px-4 py-2 border border-[#D8DEE6] dark:border-[#3A4555] rounded-lg bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF]" /> : <p className="text-[#2C3847] dark:text-[#E5E9EF]">{profile.gst_number || 'Not provided'}</p>}
                  </div>
                </>
              )}
              {profile.role === 'delivery_partner' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Vehicle Type</label>
                    {editing ? (
                      <select value={formData.vehicle_type || ''} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })} className="w-full px-4 py-2 border border-[#D8DEE6] dark:border-[#3A4555] rounded-lg bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF]">
                        <option value="">Select</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="scooter">Scooter</option>
                        <option value="car">Car</option>
                        <option value="van">Van</option>
                      </select>
                    ) : <p className="text-[#2C3847] dark:text-[#E5E9EF] capitalize">{profile.vehicle_type || 'Not provided'}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Vehicle Number</label>
                    {editing ? <input type="text" value={formData.vehicle_number || ''} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} className="w-full px-4 py-2 border border-[#D8DEE6] dark:border-[#3A4555] rounded-lg bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF]" /> : <p className="text-[#2C3847] dark:text-[#E5E9EF]">{profile.vehicle_number || 'Not provided'}</p>}
                  </div>
                </>
              )}
              {profile.role === 'customer' && (
                <div className="bg-[#EDF2F7] dark:bg-[#1A2332] rounded-lg p-4">
                  <p className="text-sm text-[#6B7A8F] dark:text-[#8A99AA] mb-3">Quick Stats</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-sm">
                      <p className="text-2xl font-bold text-[#4A9FBE] dark:text-[#6BB3CF]">{orderStats.totalOrders}</p>
                      <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA]">Total Orders</p>
                    </div>
                    <div className="text-center p-3 bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-sm">
                      <p className="text-2xl font-bold text-[#5FA889] dark:text-[#7DBFA0]">₹{orderStats.totalSpent.toFixed(0)}</p>
                      <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA]">Total Spent</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="mt-6 bg-[#FAFBFC] dark:bg-[#242D3C] rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-4">Account Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setShowPasswordModal(true)} className="px-6 py-3 bg-[#EEF5F7] dark:bg-[#1A2332] text-[#4A9FBE] dark:text-[#6BB3CF] rounded-lg font-semibold hover:bg-[#D8DEE6] dark:hover:bg-[#242D3C] transition-all flex items-center gap-2">
              🔒 Change Password
            </button>
            <button onClick={handleDownloadData} className="px-6 py-3 bg-[#F5E3E3] dark:bg-[#1A2332] text-[#D4A855] dark:text-[#D4A855] rounded-lg font-semibold hover:bg-[#F5E3E3] dark:hover:bg-[#242D3C] transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Download My Data
            </button>
            <button onClick={handleDeleteAccount} className="px-6 py-3 bg-[#F5E3E3] dark:bg-[#1A2332] text-[#8A4A4A] dark:text-[#E8C0C0] rounded-lg font-semibold hover:bg-[#F5E3E3] dark:hover:bg-[#242D3C] transition-all flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-6">Change Password</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1">New Password</label>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg pr-12"
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-3 top-9 text-[#6B7A8F] dark:text-[#8A99AA]">
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Confirm New Password</label>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full px-4 py-3 border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg pr-12"
                  placeholder="Confirm new password"
                />
                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-3 top-9 text-[#6B7A8F] dark:text-[#8A99AA]">
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleChangePassword} disabled={changingPassword} className="flex-1 bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white py-3 rounded-lg font-semibold hover:bg-[#3A7C96] dark:hover:bg-[#8AC5DC] disabled:opacity-50">
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
              <button onClick={() => { setShowPasswordModal(false); setPasswordData({ current: '', new: '', confirm: '' }); }} className="flex-1 bg-[#D8DEE6] dark:bg-[#3A4555] text-[#4A5568] dark:text-[#D1D8E0] py-3 rounded-lg font-semibold hover:bg-[#D8DEE6] dark:hover:bg-[#3A4555]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;