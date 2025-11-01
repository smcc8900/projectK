/**
 * Domain Detection Utility
 * Detects which organization to load based on the current domain
 */

import { getOrganizationByDomain } from '../services/organization.service';

/**
 * Get the current domain from window.location
 * @returns {string} The domain (e.g., 'edu.tech.com', 'abccorp.com')
 */
export const getCurrentDomain = () => {
  const hostname = window.location.hostname;
  
  // If on localhost or Firebase default domain, return null
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('web.app') ||
    hostname.includes('firebaseapp.com')
  ) {
    return null;
  }
  
  return hostname;
};

/**
 * Get organization by current domain
 * @returns {Promise<Object|null>} Organization object or null
 */
export const getOrganizationByCurrentDomain = async () => {
  const domain = getCurrentDomain();
  
  if (!domain) {
    return null;
  }
  
  try {
    const org = await getOrganizationByDomain(domain);
    return org;
  } catch (error) {
    console.error('Error fetching organization by domain:', error);
    return null;
  }
};

/**
 * Check if app is running on a custom domain
 * @returns {boolean}
 */
export const isCustomDomain = () => {
  return getCurrentDomain() !== null;
};

/**
 * Get branding information based on domain
 * @returns {Object} Branding config
 */
export const getDomainBranding = async () => {
  const org = await getOrganizationByCurrentDomain();
  
  if (!org) {
    return {
      name: 'Payroll System',
      logo: null,
      primaryColor: '#3b82f6',
      domain: null,
    };
  }
  
  return {
    name: org.orgName,
    logo: org.logo || null,
    primaryColor: org.settings?.primaryColor || '#3b82f6',
    domain: org.domain,
    orgId: org.id,
  };
};
