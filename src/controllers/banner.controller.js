import { isValidObjectId } from "mongoose";
import { createBanner, updateBanner, getBannerById, getManyBanners, deleteBanner } from "../services/banner.service.js";
import { deleteFileFromDO } from "../utils/storage.util.js";

export const createBannerCtrl = async (req, res) => {
    try {
        const createObj = req.body;

        const banner = await createBanner(createObj);

        if (!banner) {
            throw new Error('Failed')
        }

        return res.status(201).json({
            success: true,
            message: 'success',
            data: { banner },
            error: null
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getBannerByIdCtrl = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const banner = await getBannerById(id)

        if (!banner) {
            throw new Error('FAILED')
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { banner },
            error: null
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getManyBannersCtrl = async (req, res, next) => {
    try {
        let { page, entries } = req.query;
        page = parseInt(page);
        entries = parseInt(entries)
        const { search , panel, screenType} = req.query;

        const filters = {};

        if(panel?.trim()){
            filters.panel = panel.trim();
        }
        
        if(screenType?.trim() && ['desktop', 'mobile', 'tablet'].includes(screenType.trim())){
            filters.screenType = screenType.trim();
        }

        if (search?.trim()) {
            filters.$or = [
                { title: new RegExp(search, 'i') },
                { subtitle: new RegExp(search, 'i') },
            ]
        }


        let result = await getManyBanners(filters)
        console.log({ result })

        if (page && entries) {
            result = result.slice((page - 1) * entries, page * entries)
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result },
            error: null
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}


export const updateBannerCtrl = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const banner = await getBannerById(id)

        if (!banner) {
            return res.status(400).json({
                success: false,
                message: 'Not Found',
                data: null,
                error: 'NOT_FOUND'
            })
        }

        const updateObj = req.body;

        if(banner?.image?.key && (updateObj?.image?.key !== banner?.image?.key)){
            try {
                await deleteFileFromDO(banner?.image?.key)
            } catch (error) {
                console.log(error)
            }
        }

        const updatedBanner = await updateBanner(id, updateObj)

        if (!updatedBanner) {
            throw new Error('FAILED')
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { banner: updatedBanner },
            error: null
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const deleteBannerCtrl = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const banner = await deleteBanner(id)

        if (!banner) {
            throw new Error('FAILED')
        }

        if (banner?.image?.key) {
            try {
                await deleteFileFromDO(banner.image.key)
            } catch (error) {
                console.log(error)
            }
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: null,
            error: null
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}