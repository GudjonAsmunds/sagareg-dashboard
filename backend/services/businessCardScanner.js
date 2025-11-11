const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
require('dotenv').config();

const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

/**
 * Scan a business card image and extract contact information
 * @param {Buffer} imageBuffer - Image buffer of the business card
 * @returns {Object} - Extracted contact information
 */
async function scanBusinessCard(imageBuffer) {
    try {
        console.log('🔍 Starting business card analysis...');

        // Use the prebuilt business card model
        const poller = await client.beginAnalyzeDocument('prebuilt-businessCard', imageBuffer);
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            throw new Error('No business card detected in the image');
        }

        const businessCard = result.documents[0];
        const fields = businessCard.fields;

        // Extract contact information
        const contactInfo = {
            first_name: '',
            last_name: '',
            full_name: '',
            company: '',
            job_title: '',
            email: '',
            phone: '',
            mobile: '',
            website: '',
            address: '',
            source: 'business_card_scan'
        };

        // Process contact names
        if (fields.ContactNames && fields.ContactNames.values) {
            const contactName = fields.ContactNames.values[0];
            if (contactName && contactName.properties) {
                contactInfo.first_name = contactName.properties.FirstName?.content || '';
                contactInfo.last_name = contactName.properties.LastName?.content || '';
            }
        }

        // Full name
        if (fields.ContactNames && fields.ContactNames.values && fields.ContactNames.values[0]) {
            contactInfo.full_name = fields.ContactNames.values[0].content ||
                                   `${contactInfo.first_name} ${contactInfo.last_name}`.trim();
        }

        // Company names
        if (fields.CompanyNames && fields.CompanyNames.values && fields.CompanyNames.values[0]) {
            contactInfo.company = fields.CompanyNames.values[0].content || '';
        }

        // Job titles
        if (fields.JobTitles && fields.JobTitles.values && fields.JobTitles.values[0]) {
            contactInfo.job_title = fields.JobTitles.values[0].content || '';
        }

        // Emails
        if (fields.Emails && fields.Emails.values && fields.Emails.values[0]) {
            contactInfo.email = fields.Emails.values[0].content || '';
        }

        // Phone numbers - separate mobile from work phone
        if (fields.MobilePhones && fields.MobilePhones.values && fields.MobilePhones.values[0]) {
            contactInfo.mobile = fields.MobilePhones.values[0].content || '';
        }

        if (fields.WorkPhones && fields.WorkPhones.values && fields.WorkPhones.values[0]) {
            contactInfo.phone = fields.WorkPhones.values[0].content || '';
        } else if (fields.OtherPhones && fields.OtherPhones.values && fields.OtherPhones.values[0]) {
            contactInfo.phone = fields.OtherPhones.values[0].content || '';
        }

        // Websites
        if (fields.Websites && fields.Websites.values && fields.Websites.values[0]) {
            contactInfo.website = fields.Websites.values[0].content || '';
        }

        // Addresses
        if (fields.Addresses && fields.Addresses.values && fields.Addresses.values[0]) {
            contactInfo.address = fields.Addresses.values[0].content || '';
        }

        console.log('✅ Business card scanned successfully');
        console.log('📇 Extracted info:', contactInfo);

        return {
            success: true,
            data: contactInfo,
            confidence: businessCard.confidence || 0
        };

    } catch (error) {
        console.error('❌ Error scanning business card:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    scanBusinessCard
};
