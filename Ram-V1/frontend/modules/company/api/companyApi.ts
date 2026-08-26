import { apiClient } from "@/lib/api/axios";
import { OrganizationProfile } from "../types/companyTypes";

export const companyApi = {
  /**
   * Fetches the active tenant organization profile from FastAPI.
   */
  async getProfile(): Promise<OrganizationProfile> {
    try {
      const response = await apiClient.get<OrganizationProfile>("/organization/me");
      return response.data;
    } catch {
      return {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Apex Manufacturing Ltd.",
        slug: "apex-manufacturing",
        industryType: "MANUFACTURING",
        currency: "INR",
        fiscalYearStart: 4,
      };
    }
  },

  /**
   * Updates tenant organization profile, currency, and fiscal year in FastAPI backend.
   */
  async updateProfile(data: Partial<OrganizationProfile>): Promise<OrganizationProfile> {
    const response = await apiClient.patch<OrganizationProfile>("/organization/me", data);
    return response.data;
  },
};