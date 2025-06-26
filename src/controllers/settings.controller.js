import { getSiteSettings, updateSiteSettings } from "../services/settings.service.js";

export const siteSettingsCtrl = async (req, res) => {   
    try {
        const settings = await getSiteSettings();
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "Site settings not found.",
                error: "NOT_FOUND"
            });
        }   
        return res.status(200).json({
            success: true,
            message: "Site settings retrieved successfully.",
            data: {
                result: settings,
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error retrieving site settings.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}

export const updateSiteSettingsCtrl = async (req, res) => {
    try {
        const updatedSettings = await updateSiteSettings(req.body);
        console.log({updatedSettings})

        const settings = await getSiteSettings();
        return res.status(200).json({
            success: true,
            message: "Site settings updated successfully.",
            data: {
                result: settings,
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error updating site settings.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}