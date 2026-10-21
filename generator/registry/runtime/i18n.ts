import NepaliDate from 'nepali-date-converter';
import type { SiteData } from './types';

/**
 * Interface text used by components (button labels, default headings...).
 * School content itself is translated in the config under `translations.<code>`.
 * Add a language by adding a dictionary here; missing keys fall back to English.
 */
const dictionaries = {
    en: {
        applyNow: 'Apply Now',
        applyForAdmission: 'Apply for admission',
        bookCampusVisit: 'Book a campus visit',
        enquireNow: 'Enquire now',
        readMore: 'Read more',
        backToNews: 'Back to news',
        home: 'Home',
        breadcrumb: 'Breadcrumb',
        skipToContent: 'Skip to content',
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        mainMenu: 'Main',
        language: 'Language',
        quickLinks: 'Quick Links',
        contact: 'Contact',
        allRightsReserved: 'All rights reserved.',
        established: 'Established {year}',
        since: 'Since {year}',
        yearsOfExcellence: 'Years of excellence',
        aboutSchool: 'About {school}',
        welcomeTo: 'Welcome to {school}',
        discoverOurStory: 'Discover our story',
        whatGuidesUs: 'What guides us',
        missionVisionValues: 'Mission, Vision & Values',
        ourMission: 'Our Mission',
        ourVision: 'Our Vision',
        ourValues: 'Our Values',
        principalsMessage: "Principal's Message",
        fromThePrincipal: 'From the desk of the principal',
        academics: 'Academics',
        programsTitle: 'Programs that shape futures',
        programsSubtitle: 'A balanced curriculum that pairs academic rigour with creativity, character and care.',
        exploreAllPrograms: 'Explore all programs',
        facilitiesEyebrow: 'Campus & Facilities',
        facilitiesTitle: 'Spaces designed for learning',
        facilitiesSubtitle: 'Modern, safe and inspiring environments where every learner can thrive.',
        viewAllFacilities: 'View all facilities',
        ourPeople: 'Our People',
        facultyTitle: 'Meet our faculty',
        facultySubtitle: 'Experienced, caring educators who know every learner by name.',
        facultyDepartment: 'Faculty',
        gallery: 'Gallery',
        galleryTitle: 'Life on campus',
        galleryImage: 'Gallery image',
        imagePreview: 'Image preview',
        openGallery: 'Open the gallery',
        filterGallery: 'Filter gallery',
        all: 'All',
        close: 'Close',
        photoAlbums: 'Photo albums',
        albumsTitle: 'Moments from the year',
        photoCount: '{count} photos',
        viewAlbum: 'View album',
        backToGallery: 'Back to the gallery',
        videos: 'Videos',
        videosTitle: 'Watch school life',
        playVideo: 'Play video: {title}',
        watchVideo: 'Watch the video',
        previousImage: 'Previous image',
        nextImage: 'Next image',
        latestNews: 'Latest News',
        newsTitle: 'What’s happening at school',
        allNews: 'All news & updates',
        searchNews: 'Search news',
        filterByCategory: 'Filter by category',
        clearFilter: 'Clear filter',
        resultCount: '{count} results',
        resultCountOne: '1 result',
        noNewsFound: 'No stories match your search.',
        calendar: 'Calendar',
        upcomingEvents: 'Upcoming events',
        fieldRequired: '{field} is required.',
        fieldTooLong: '{field} must be {max} characters or fewer.',
        invalidEmail: 'Please enter a valid email address.',
        invalidDate: 'Please enter a valid date.',
        invalidChoice: 'Please choose one of the options.',
        mustAccept: 'Please tick this box to continue.',
        fileType: 'Please upload a {types} file.',
        fileTooLarge: 'The file must be {size} MB or smaller.',
        next: 'Next',
        back: 'Back',
        submit: 'Submit',
        submitting: 'Submitting…',
        stepOf: 'Step {step} of {total}',
        notProvided: 'Not provided',
        formFailed: 'Something went wrong. Please try again.',
        applicationReceived: 'Thank you! We have received your application.',
        submissionReceived: 'Thank you! We have received your submission.',
        yourReference: 'Your reference number is {reference}. Please keep it to check your application status.',
        yourReferenceToQuote: 'Your reference number is {reference}. Please quote it when you contact us.',
        reviewedBeforePublishing: 'It will appear on the website once our team has reviewed it.',
        applyOnline: 'Apply online',
        admissionFormTitle: 'Admission application form',
        trackApplication: 'Track your application',
        trackApplicationSubtitle: 'Enter your reference number and the email address you applied with.',
        referenceNumber: 'Reference number',
        checkStatus: 'Check status',
        applicationNotFound: 'We could not find an application with those details.',
        applicationStatus: 'Application {reference}: {status}',
        lastUpdated: 'Last updated {date}',
        status_received: 'Received',
        status_reviewing: 'Under review',
        status_interview: 'Interview scheduled',
        status_accepted: 'Accepted',
        status_waitlisted: 'Waitlisted',
        status_rejected: 'Not successful',
        status_hired: 'Hired',
        status_pending: 'Pending review',
        status_approved: 'Approved',
        careersTitle: 'Join our team',
        noOpenings: 'There are no openings right now. Please check back soon.',
        applyBy: 'Apply by {date}',
        requirements: 'Requirements',
        applyForThisJob: 'Apply for this position',
        downloads: 'Downloads',
        downloadsTitle: 'Forms & documents',
        download: 'Download',
        otherFiles: 'Other files',
        alumni: 'Alumni',
        alumniTitle: 'Where our graduates are now',
        batchOf: 'Batch of {year}',
        joinAlumni: 'Join the alumni network',
        shareExperience: 'Share your experience',
        shareExperienceSubtitle: 'Parents, students and alumni: tell us about your time with us.',
        chatOnWhatsapp: 'Chat with us on WhatsApp',
        whatsappGreeting: 'Hello {school}, I have a question.',
        newsletterTitle: 'Never miss a notice',
        newsletterSubtitle: 'Get school news by email and urgent alerts, like closures, by SMS.',
        mobileForSms: 'Mobile for SMS (optional)',
        subscribe: 'Subscribe',
        subscribed: 'Thank you! You are subscribed.',
        results: 'Results',
        resultsTitle: 'Check your exam results',
        resultsSubtitle: 'Choose the exam and enter your symbol number and date of birth.',
        noResultsPublished: 'No results have been published yet.',
        exam: 'Exam',
        symbolNumber: 'Symbol number',
        dateOfBirthAsAdmitCard: 'Date of birth (as on the admit card)',
        viewResult: 'View result',
        resultNotFound: 'No result matches that symbol number and date of birth.',
        studentName: 'Student',
        class: 'Class',
        subject: 'Subject',
        gradeOrMarks: 'Grade / marks',
        print: 'Print',
        resultDisclaimer: 'This online result is for information only. The marksheet issued by the school is the official record.',
        addToCalendar: 'Add to calendar',
        subscribeCalendar: 'Subscribe to the calendar',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        noEventsThisMonth: 'No events this month.',
        eventsOn: 'Events on {date}',
        until: 'until {date}',
        noticeBoard: 'Notice Board',
        noticesTitle: 'Notices & circulars',
        important: 'Important',
        testimonials: 'Testimonials',
        testimonialsTitle: 'Voices of our community',
        previousTestimonial: 'Previous testimonial',
        nextTestimonial: 'Next testimonial',
        showTestimonial: 'Show testimonial {number}',
        achievements: 'Achievements',
        achievementsTitle: 'Milestones we are proud of',
        admissions: 'Admissions',
        admissionsOpen: 'Admissions Open',
        admissionsTitle: 'Join our school community',
        applicationsClose: 'Applications close {date}',
        documentsRequired: 'Documents required',
        feeStructure: 'Fee structure',
        faq: 'FAQ',
        faqTitle: 'Frequently asked questions',
        ctaTitle: 'Give your child the {school} advantage',
        ctaSubtitle: 'Visit our campus, meet our teachers and see learning in action.',
        getInTouch: 'Get in touch',
        contactTitle: 'We’d love to hear from you',
        visitUs: 'Visit us',
        ourCampuses: 'Our Campuses',
        campusesTitle: 'Find a campus near you',
        getDirections: 'Get directions',
        campus: 'Campus',
        anyCampus: 'Any campus',
        callUs: 'Call us',
        emailUs: 'Email us',
        officeHours: 'Office hours',
        mapOf: 'Map of {school}',
        fullName: 'Full name',
        email: 'Email',
        phoneOptional: 'Phone (optional)',
        message: 'Message',
        admissionsEnquiry: 'Admissions enquiry',
        campusVisit: 'Campus visit',
        generalQuestion: 'General question',
        careers: 'Careers',
        sendMessage: 'Send message',
        sending: 'Sending…',
        messageSent: 'Thank you! Our team will get back to you shortly.',
        messageFailed: 'Something went wrong. Please try again or call us.',
    },
    ne: {
        applyNow: 'भर्ना हुनुहोस्',
        applyForAdmission: 'भर्नाका लागि आवेदन',
        bookCampusVisit: 'विद्यालय भ्रमण बुक गर्नुहोस्',
        enquireNow: 'सोधपुछ गर्नुहोस्',
        readMore: 'थप पढ्नुहोस्',
        backToNews: 'समाचारमा फर्कनुहोस्',
        home: 'गृहपृष्ठ',
        breadcrumb: 'पृष्ठ मार्ग',
        skipToContent: 'मुख्य सामग्रीमा जानुहोस्',
        openMenu: 'मेनु खोल्नुहोस्',
        closeMenu: 'मेनु बन्द गर्नुहोस्',
        mainMenu: 'मुख्य',
        language: 'भाषा',
        quickLinks: 'छिटो लिंकहरू',
        contact: 'सम्पर्क',
        allRightsReserved: 'सर्वाधिकार सुरक्षित।',
        established: 'स्थापना {year}',
        since: '{year} देखि',
        yearsOfExcellence: 'वर्षको उत्कृष्टता',
        aboutSchool: '{school} बारे',
        welcomeTo: '{school} मा स्वागत छ',
        discoverOurStory: 'हाम्रो कथा पढ्नुहोस्',
        whatGuidesUs: 'हाम्रो मार्गदर्शन',
        missionVisionValues: 'लक्ष्य, दृष्टि र मूल्यहरू',
        ourMission: 'हाम्रो लक्ष्य',
        ourVision: 'हाम्रो दृष्टि',
        ourValues: 'हाम्रा मूल्यहरू',
        principalsMessage: 'प्रधानाध्यापकको सन्देश',
        fromThePrincipal: 'प्रधानाध्यापकको कलमबाट',
        academics: 'शैक्षिक कार्यक्रम',
        programsTitle: 'भविष्य निर्माण गर्ने कार्यक्रमहरू',
        programsSubtitle: 'शैक्षिक उत्कृष्टता, सिर्जनशीलता, चरित्र र हेरचाहलाई सँगै लैजाने सन्तुलित पाठ्यक्रम।',
        exploreAllPrograms: 'सबै कार्यक्रम हेर्नुहोस्',
        facilitiesEyebrow: 'क्याम्पस र सुविधाहरू',
        facilitiesTitle: 'सिकाइका लागि बनाइएका ठाउँहरू',
        facilitiesSubtitle: 'हरेक विद्यार्थी फस्टाउन सक्ने आधुनिक, सुरक्षित र प्रेरणादायी वातावरण।',
        viewAllFacilities: 'सबै सुविधा हेर्नुहोस्',
        ourPeople: 'हाम्रा व्यक्तिहरू',
        facultyTitle: 'हाम्रा शिक्षकहरू',
        facultySubtitle: 'हरेक विद्यार्थीलाई नामले चिन्ने अनुभवी र स्नेही शिक्षकहरू।',
        facultyDepartment: 'शिक्षक',
        gallery: 'ग्यालेरी',
        galleryTitle: 'विद्यालयको जीवन',
        galleryImage: 'ग्यालेरी तस्बिर',
        imagePreview: 'तस्बिर पूर्वावलोकन',
        openGallery: 'ग्यालेरी खोल्नुहोस्',
        filterGallery: 'ग्यालेरी छान्नुहोस्',
        all: 'सबै',
        close: 'बन्द गर्नुहोस्',
        photoAlbums: 'फोटो एल्बमहरू',
        albumsTitle: 'वर्षभरिका क्षणहरू',
        photoCount: '{count} तस्बिर',
        viewAlbum: 'एल्बम हेर्नुहोस्',
        backToGallery: 'ग्यालेरीमा फर्कनुहोस्',
        videos: 'भिडियोहरू',
        videosTitle: 'विद्यालयको जीवन हेर्नुहोस्',
        playVideo: 'भिडियो चलाउनुहोस्: {title}',
        watchVideo: 'भिडियो हेर्नुहोस्',
        previousImage: 'अघिल्लो तस्बिर',
        nextImage: 'अर्को तस्बिर',
        latestNews: 'ताजा समाचार',
        newsTitle: 'विद्यालयमा के भइरहेको छ',
        allNews: 'सबै समाचार र अपडेट',
        searchNews: 'समाचार खोज्नुहोस्',
        filterByCategory: 'वर्ग अनुसार छान्नुहोस्',
        clearFilter: 'फिल्टर हटाउनुहोस्',
        resultCount: '{count} नतिजा',
        resultCountOne: '१ नतिजा',
        noNewsFound: 'तपाईंको खोजसँग मिल्ने समाचार भेटिएन।',
        calendar: 'पात्रो',
        upcomingEvents: 'आगामी कार्यक्रमहरू',
        fieldRequired: '{field} आवश्यक छ।',
        fieldTooLong: '{field} {max} अक्षरभन्दा बढी हुनुहुँदैन।',
        invalidEmail: 'कृपया सही इमेल ठेगाना लेख्नुहोस्।',
        invalidDate: 'कृपया सही मिति लेख्नुहोस्।',
        invalidChoice: 'कृपया एउटा विकल्प छान्नुहोस्।',
        mustAccept: 'अगाडि बढ्न कृपया यो बाकसमा चिन्ह लगाउनुहोस्।',
        fileType: 'कृपया {types} फाइल अपलोड गर्नुहोस्।',
        fileTooLarge: 'फाइल {size} MB भन्दा सानो हुनुपर्छ।',
        next: 'अर्को',
        back: 'पछाडि',
        submit: 'पेश गर्नुहोस्',
        submitting: 'पेश गर्दै…',
        stepOf: 'चरण {step} / {total}',
        notProvided: 'दिइएको छैन',
        formFailed: 'केही गडबड भयो। कृपया फेरि प्रयास गर्नुहोस्।',
        applicationReceived: 'धन्यवाद! हामीले तपाईंको आवेदन प्राप्त गर्यौं।',
        submissionReceived: 'धन्यवाद! हामीले तपाईंको विवरण प्राप्त गर्यौं।',
        yourReference: 'तपाईंको सन्दर्भ नम्बर {reference} हो। आवेदनको स्थिति हेर्न यसलाई सुरक्षित राख्नुहोस्।',
        yourReferenceToQuote: 'तपाईंको सन्दर्भ नम्बर {reference} हो। हामीलाई सम्पर्क गर्दा यो नम्बर उल्लेख गर्नुहोस्।',
        reviewedBeforePublishing: 'हाम्रो टोलीले हेरेपछि यो वेबसाइटमा देखिनेछ।',
        applyOnline: 'अनलाइन आवेदन',
        admissionFormTitle: 'भर्ना आवेदन फारम',
        trackApplication: 'आवेदनको स्थिति हेर्नुहोस्',
        trackApplicationSubtitle: 'सन्दर्भ नम्बर र आवेदन दिँदा प्रयोग गरेको इमेल लेख्नुहोस्।',
        referenceNumber: 'सन्दर्भ नम्बर',
        checkStatus: 'स्थिति हेर्नुहोस्',
        applicationNotFound: 'यी विवरणसँग मिल्ने आवेदन भेटिएन।',
        applicationStatus: 'आवेदन {reference}: {status}',
        lastUpdated: 'अन्तिम अपडेट {date}',
        status_received: 'प्राप्त भयो',
        status_reviewing: 'समीक्षा हुँदै',
        status_interview: 'अन्तर्वार्ता तय भयो',
        status_accepted: 'स्वीकृत',
        status_waitlisted: 'प्रतीक्षा सूचीमा',
        status_rejected: 'सफल हुन सकेन',
        status_hired: 'नियुक्त',
        status_pending: 'समीक्षा बाँकी',
        status_approved: 'स्वीकृत',
        careersTitle: 'हाम्रो टोलीमा सामेल हुनुहोस्',
        noOpenings: 'अहिले कुनै पद खाली छैन। कृपया पछि फेरि हेर्नुहोस्।',
        applyBy: '{date} भित्र आवेदन दिनुहोस्',
        requirements: 'आवश्यकताहरू',
        applyForThisJob: 'यो पदका लागि आवेदन दिनुहोस्',
        downloads: 'डाउनलोड',
        downloadsTitle: 'फारम र कागजातहरू',
        download: 'डाउनलोड गर्नुहोस्',
        otherFiles: 'अन्य फाइलहरू',
        alumni: 'पूर्व विद्यार्थी',
        alumniTitle: 'हाम्रा स्नातकहरू अहिले कहाँ छन्',
        batchOf: '{year} ब्याच',
        joinAlumni: 'पूर्व विद्यार्थी सञ्जालमा जोडिनुहोस्',
        shareExperience: 'आफ्नो अनुभव बाँड्नुहोस्',
        shareExperienceSubtitle: 'अभिभावक, विद्यार्थी र पूर्व विद्यार्थीहरू: हामीसँगको आफ्नो अनुभव सुनाउनुहोस्।',
        chatOnWhatsapp: 'WhatsApp मा कुरा गर्नुहोस्',
        whatsappGreeting: 'नमस्ते {school}, मेरो एउटा प्रश्न छ।',
        newsletterTitle: 'कुनै सूचना नछुटाउनुहोस्',
        newsletterSubtitle: 'विद्यालयका समाचार इमेलमा र बिदा जस्ता जरुरी सूचना SMS मा पाउनुहोस्।',
        mobileForSms: 'SMS का लागि मोबाइल (ऐच्छिक)',
        subscribe: 'सदस्यता लिनुहोस्',
        subscribed: 'धन्यवाद! तपाईंले सदस्यता लिनुभयो।',
        results: 'नतिजा',
        resultsTitle: 'परीक्षाको नतिजा हेर्नुहोस्',
        resultsSubtitle: 'परीक्षा छान्नुहोस् र सिम्बोल नम्बर तथा जन्म मिति लेख्नुहोस्।',
        noResultsPublished: 'अहिलेसम्म कुनै नतिजा प्रकाशित भएको छैन।',
        exam: 'परीक्षा',
        symbolNumber: 'सिम्बोल नम्बर',
        dateOfBirthAsAdmitCard: 'जन्म मिति (प्रवेशपत्र अनुसार)',
        viewResult: 'नतिजा हेर्नुहोस्',
        resultNotFound: 'उक्त सिम्बोल नम्बर र जन्म मितिसँग मिल्ने नतिजा भेटिएन।',
        studentName: 'विद्यार्थी',
        class: 'कक्षा',
        subject: 'विषय',
        gradeOrMarks: 'ग्रेड / अंक',
        print: 'प्रिन्ट गर्नुहोस्',
        resultDisclaimer: 'यो अनलाइन नतिजा जानकारीका लागि मात्र हो। विद्यालयले जारी गर्ने लब्धाङ्क पत्र नै आधिकारिक हो।',
        addToCalendar: 'पात्रोमा थप्नुहोस्',
        subscribeCalendar: 'पात्रो सब्स्क्राइब गर्नुहोस्',
        previousMonth: 'अघिल्लो महिना',
        nextMonth: 'अर्को महिना',
        noEventsThisMonth: 'यो महिना कुनै कार्यक्रम छैन।',
        eventsOn: '{date} का कार्यक्रमहरू',
        until: '{date} सम्म',
        noticeBoard: 'सूचना पाटी',
        noticesTitle: 'सूचना र परिपत्रहरू',
        important: 'महत्त्वपूर्ण',
        testimonials: 'अनुभवहरू',
        testimonialsTitle: 'हाम्रो समुदायका आवाजहरू',
        previousTestimonial: 'अघिल्लो अनुभव',
        nextTestimonial: 'अर्को अनुभव',
        showTestimonial: 'अनुभव {number} हेर्नुहोस्',
        achievements: 'उपलब्धिहरू',
        achievementsTitle: 'हामीले गर्व गर्ने उपलब्धिहरू',
        admissions: 'भर्ना',
        admissionsOpen: 'भर्ना खुला छ',
        admissionsTitle: 'हाम्रो विद्यालय परिवारमा सामेल हुनुहोस्',
        applicationsClose: 'आवेदनको अन्तिम मिति {date}',
        documentsRequired: 'आवश्यक कागजातहरू',
        feeStructure: 'शुल्क विवरण',
        faq: 'प्रश्नोत्तर',
        faqTitle: 'बारम्बार सोधिने प्रश्नहरू',
        ctaTitle: 'आफ्नो बच्चालाई {school} को अवसर दिनुहोस्',
        ctaSubtitle: 'हाम्रो विद्यालय घुम्नुहोस्, शिक्षकहरूलाई भेट्नुहोस् र सिकाइ प्रत्यक्ष हेर्नुहोस्।',
        getInTouch: 'सम्पर्कमा रहनुहोस्',
        contactTitle: 'हामी तपाईंसँग कुरा गर्न चाहन्छौं',
        visitUs: 'हामीलाई भेट्नुहोस्',
        ourCampuses: 'हाम्रा क्याम्पसहरू',
        campusesTitle: 'तपाईंको नजिकको क्याम्पस खोज्नुहोस्',
        getDirections: 'बाटो हेर्नुहोस्',
        campus: 'क्याम्पस',
        anyCampus: 'जुनसुकै क्याम्पस',
        callUs: 'फोन गर्नुहोस्',
        emailUs: 'इमेल गर्नुहोस्',
        officeHours: 'कार्यालय समय',
        mapOf: '{school} को नक्सा',
        fullName: 'पूरा नाम',
        email: 'इमेल',
        phoneOptional: 'फोन (ऐच्छिक)',
        message: 'सन्देश',
        admissionsEnquiry: 'भर्ना सम्बन्धी सोधपुछ',
        campusVisit: 'विद्यालय भ्रमण',
        generalQuestion: 'सामान्य प्रश्न',
        careers: 'रोजगारी',
        sendMessage: 'सन्देश पठाउनुहोस्',
        sending: 'पठाउँदै…',
        messageSent: 'धन्यवाद! हाम्रो टोलीले छिट्टै सम्पर्क गर्नेछ।',
        messageFailed: 'केही गडबड भयो। कृपया फेरि प्रयास गर्नुहोस् वा फोन गर्नुहोस्।',
    },
} satisfies Record<string, Record<string, string>>;

export type TranslationKey = keyof (typeof dictionaries)['en'];

export const languageNames: Record<string, string> = { en: 'English', ne: 'नेपाली' };

export function localeOf(site: SiteData): string {
    return site.i18n?.locale ?? 'en';
}

/**
 * Translate an interface string for the site's language, filling {placeholders}.
 */
export function t(site: SiteData, key: TranslationKey, vars: Record<string, string | number> = {}): string {
    const dictionary = (dictionaries as Record<string, Partial<Record<TranslationKey, string>>>)[localeOf(site)] ?? {};
    const text = dictionary[key] ?? dictionaries.en[key];

    return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/**
 * Prefix a site path with the language segment for non-default languages (/about → /ne/about).
 */
export function localizedPath(site: SiteData, path: string): string {
    const base = site.i18n?.basePath ?? '';

    if (!base || !path.startsWith('/') || path.startsWith('//')) {
        return path;
    }

    return path === '/' ? base : `${base}${path}`;
}

/**
 * Remove the language segment from a path (/ne/about → /about).
 */
export function unlocalizedPath(site: SiteData, path: string): string {
    const base = site.i18n?.basePath ?? '';

    if (base && (path === base || path.startsWith(`${base}/`))) {
        return path.slice(base.length) || '/';
    }

    return path;
}

const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function localizeDigits(site: SiteData, value: string | number): string {
    return localeOf(site) === 'ne' ? String(value).replace(/\d/g, (digit) => devanagariDigits[Number(digit)]) : String(value);
}

/**
 * Format an ISO date (YYYY-MM-DD) for the site: Bikram Sambat in Nepali when the
 * language uses the BS calendar, otherwise the Gregorian date in the language.
 */
export function formatSiteDate(site: SiteData, value: string | undefined, style: 'short' | 'long' | 'full' = 'short'): string {
    if (!value) {
        return '';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    if (site.i18n?.calendar === 'bs') {
        const nepali = new NepaliDate(date);
        const language = localeOf(site) === 'ne' ? 'np' : 'en';
        const format = style === 'full' ? 'ddd, D MMMM YYYY' : style === 'long' ? 'D MMMM YYYY' : 'D MMM YYYY';

        return nepali.format(format, language);
    }

    const options: Intl.DateTimeFormatOptions =
        style === 'full' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : style === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' };

    return new Intl.DateTimeFormat(localeOf(site) === 'ne' ? 'ne-NP' : 'en', options).format(date);
}

/**
 * Day, short month and year of a date in the site's calendar (for date badges).
 */
export function siteDateParts(site: SiteData, value: string): { day: string; month: string; year: string } {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return { day: '', month: value, year: '' };
    }

    if (site.i18n?.calendar === 'bs') {
        const nepali = new NepaliDate(date);
        const language = localeOf(site) === 'ne' ? 'np' : 'en';

        return { day: nepali.format('D', language), month: nepali.format('MMM', language), year: nepali.format('YYYY', language) };
    }

    const locale = localeOf(site) === 'ne' ? 'ne-NP' : 'en';

    return {
        day: new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date),
        month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
        year: new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(date),
    };
}

/** YYYY-MM-DD of a local date. */
export function isoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * A month of the site's calendar (Bikram Sambat or Gregorian), `offset` months
 * after the month containing `value`: its name and its days as ISO dates.
 */
export function calendarMonth(site: SiteData, value: string, offset = 0): { label: string; days: string[] } {
    const start = new Date(`${value}T00:00:00`);
    const days: string[] = [];

    if (site.i18n?.calendar === 'bs') {
        const nepali = new NepaliDate(start);
        const index = nepali.getYear() * 12 + nepali.getMonth() + offset;
        const first = new NepaliDate(Math.floor(index / 12), index % 12, 1);
        const day = first.toJsDate();

        while (new NepaliDate(day).getMonth() === first.getMonth()) {
            days.push(isoDate(day));
            day.setDate(day.getDate() + 1);
        }

        return { label: first.format('MMMM YYYY', localeOf(site) === 'ne' ? 'np' : 'en'), days };
    }

    const first = new Date(start.getFullYear(), start.getMonth() + offset, 1);

    for (const day = new Date(first); day.getMonth() === first.getMonth(); day.setDate(day.getDate() + 1)) {
        days.push(isoDate(day));
    }

    return { label: new Intl.DateTimeFormat(localeOf(site) === 'ne' ? 'ne-NP' : 'en', { month: 'long', year: 'numeric' }).format(first), days };
}

const nepaliWeekdays = ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

/**
 * Short weekday names, Sunday first. Nepali names are built in because not every
 * browser ships Nepali locale data, and server and browser markup must match.
 */
export function weekdayNames(site: SiteData): string[] {
    if (localeOf(site) === 'ne') {
        return nepaliWeekdays;
    }

    const format = new Intl.DateTimeFormat(localeOf(site) === 'ne' ? 'ne-NP' : 'en', { weekday: 'short' });

    return Array.from({ length: 7 }, (_, index) => format.format(new Date(2026, 0, 4 + index)));
}
