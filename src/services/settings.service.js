import { SiteSettings } from "../models/siteSettings.model.js";

export const updateSiteSettings = async (settings) => {
    return await SiteSettings.updateOne(
        { _id: "default" },
        {
            $set: settings
        },
        { upsert: true }
    );

}
export const getSiteSettings = async () => {
    return await SiteSettings.findOne({ _id: "default" }).lean();
}