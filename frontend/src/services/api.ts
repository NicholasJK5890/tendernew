import {
  User, VendorProfile, Tender, Bid, Clarification,
  Notification, AuditLog, Rulebook, TenderMatchResult
} from '../types';

const API_BASE = '/api';

// Helper to get selected demo user email from localStorage
export const getCurrentUserEmail = (): string => {
  return localStorage.getItem('tenderlens_user_email') || 'officer@cpwd.gov.in';
};

export const setCurrentUserEmail = (email: string) => {
  localStorage.setItem('tenderlens_user_email', email);
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-User-Email': getCurrentUserEmail()
  };
};

export const api = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },
  getMe: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/users/me`, { headers: getHeaders() });
    return res.json();
  },

  // Vendor Profile
  getVendorProfile: async (): Promise<VendorProfile> => {
    const res = await fetch(`${API_BASE}/vendors/me`, { headers: getHeaders() });
    return res.json();
  },
  updateVendorProfile: async (data: Partial<VendorProfile>): Promise<VendorProfile> => {
    const res = await fetch(`${API_BASE}/vendors/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getVendorMatches: async (category?: string): Promise<TenderMatchResult[]> => {
    const url = category && category !== 'All' 
      ? `${API_BASE}/vendors/me/matches?category=${encodeURIComponent(category)}`
      : `${API_BASE}/vendors/me/matches`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },
  getVendorApplications: async (): Promise<Bid[]> => {
    const res = await fetch(`${API_BASE}/vendors/me/applications`, { headers: getHeaders() });
    return res.json();
  },

  // Tenders
  getTenders: async (category?: string, status?: string, search?: string): Promise<Tender[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/tenders?${params.toString()}`);
    return res.json();
  },
  getTender: async (id: number): Promise<Tender> => {
    const res = await fetch(`${API_BASE}/tenders/${id}`);
    return res.json();
  },
  createTender: async (tender: any): Promise<Tender> => {
    const res = await fetch(`${API_BASE}/tenders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(tender)
    });
    return res.json();
  },
  uploadNit: async (formData: FormData): Promise<any> => {
    const res = await fetch(`${API_BASE}/tenders/upload`, {
      method: 'POST',
      headers: {
        'X-User-Email': getCurrentUserEmail()
      },
      body: formData
    });
    return res.json();
  },
  confirmTender: async (tenderId: number, requirements: any[]): Promise<Tender> => {
    const res = await fetch(`${API_BASE}/tenders/${tenderId}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requirements)
    });
    return res.json();
  },
  approveTender: async (tenderId: number, payload: { notes?: string; override_reason?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/tenders/${tenderId}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Bids & Evaluation
  getTenderBids: async (tenderId: number): Promise<Bid[]> => {
    const res = await fetch(`${API_BASE}/tenders/${tenderId}/bids`);
    return res.json();
  },
  submitBid: async (tenderId: number, bid: any): Promise<Bid> => {
    const res = await fetch(`${API_BASE}/tenders/${tenderId}/bids`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bid)
    });
    return res.json();
  },
  runEvaluation: async (tenderId: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/tenders/${tenderId}/evaluate`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Clarifications
  getClarifications: async (tenderId?: number, vendorId?: number): Promise<Clarification[]> => {
    const params = new URLSearchParams();
    if (tenderId) params.append('tender_id', tenderId.toString());
    if (vendorId) params.append('vendor_id', vendorId.toString());
    const res = await fetch(`${API_BASE}/clarifications?${params.toString()}`);
    return res.json();
  },
  createClarification: async (data: { tender_id: number; bid_id: number; vendor_id: number; query_text: string }): Promise<Clarification> => {
    const res = await fetch(`${API_BASE}/clarifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  replyClarification: async (id: number, responseText: string): Promise<Clarification> => {
    const res = await fetch(`${API_BASE}/clarifications/${id}/reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ response_text: responseText })
    });
    return res.json();
  },

  // Notifications
  getNotifications: async (role?: string): Promise<Notification[]> => {
    const url = role ? `${API_BASE}/notifications?role=${role}` : `${API_BASE}/notifications`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },
  markNotificationRead: async (id: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Categories & Rulebooks
  getCategories: async (): Promise<Array<{ category: string; tender_count: number; standards: string[] }>> => {
    const res = await fetch(`${API_BASE}/categories`);
    return res.json();
  },
  getRulebook: async (category: string): Promise<Rulebook> => {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(category)}/rulebook`);
    return res.json();
  },

  // Audit Log
  getAuditLog: async (role?: string, action?: string): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (role && role !== 'All') params.append('role', role);
    if (action && action !== 'All') params.append('action', action);
    const res = await fetch(`${API_BASE}/audit-log?${params.toString()}`);
    return res.json();
  },

  // Dashboard Stats
  getDashboardStats: async (role: string = 'officer'): Promise<any> => {
    const res = await fetch(`${API_BASE}/stats/dashboard?role=${role}`);
    return res.json();
  }
};
