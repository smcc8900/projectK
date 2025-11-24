import React, { useState, useEffect } from 'react';
import { Building, MapPin, Plus, Trash2, Edit2, X, Check, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { addBranch, getBranches, updateBranch, deleteBranch } from '../../services/branch.service';

export const ManageBranches = ({ orgId, orgName }) => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        contactEmail: ''
    });

    useEffect(() => {
        if (orgId) {
            loadBranches();
        }
    }, [orgId]);

    const loadBranches = async () => {
        try {
            setLoading(true);
            const data = await getBranches(orgId);
            setBranches(data);
        } catch (error) {
            console.error('Error loading branches:', error);
            toast.error('Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateBranch(orgId, editingId, formData);
                toast.success('Branch updated successfully');
            } else {
                await addBranch(orgId, formData);
                toast.success('Branch added successfully');
            }

            resetForm();
            loadBranches();
        } catch (error) {
            console.error('Error saving branch:', error);
            toast.error('Failed to save branch');
        }
    };

    const handleEdit = (branch) => {
        setFormData({
            name: branch.name,
            address: branch.address || '',
            city: branch.city || '',
            state: branch.state || '',
            contactEmail: branch.contactEmail || ''
        });
        setEditingId(branch.id);
        setIsAdding(true);
    };

    const handleDelete = async (branchId) => {
        if (!window.confirm('Are you sure you want to delete this branch?')) return;

        try {
            await deleteBranch(orgId, branchId);
            toast.success('Branch deleted successfully');
            loadBranches();
        } catch (error) {
            console.error('Error deleting branch:', error);
            toast.error('Failed to delete branch');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            city: '',
            state: '',
            contactEmail: ''
        });
        setIsAdding(false);
        setEditingId(null);
    };

    if (!orgId) return <div className="text-gray-500">Select an organization to manage branches</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Branches</h2>
                    <p className="text-sm text-gray-500">Manage branches for {orgName}</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Branch
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900">{editingId ? 'Edit Branch' : 'New Branch'}</h3>
                        <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Downtown Office"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="123 Main St"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="New York"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="NY"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="branch@example.com"
                            />
                        </div>

                        <div className="col-span-2 flex justify-end space-x-3 mt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {editingId ? 'Update Branch' : 'Save Branch'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : branches.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Building className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p>No branches found for this organization.</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Add your first branch
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {branches.map((branch) => (
                        <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Building className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                                        {(branch.city || branch.state) && (
                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {branch.city}{branch.city && branch.state ? ', ' : ''}{branch.state}
                                            </div>
                                        )}
                                        {branch.contactEmail && (
                                            <p className="text-sm text-gray-500 mt-1">{branch.contactEmail}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(branch)}
                                        className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
