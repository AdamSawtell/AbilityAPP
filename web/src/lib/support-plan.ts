export type SupportPlanGoalLine = {
  id: string;
  lineNo: number;
  name: string;
  goalNumber: string;
  goalTerm: string;
  goalType: string;
  goal: string;
  supportRequired: string;
  startDate: string;
  endDate: string;
};

export type SupportPlanRecord = {
  id: string;
  clientId: string;
  documentNo: string;
  description: string;
  providedToReceiver: string;
  executionDate: string;
  active: boolean;
  importantToMe: string;
  howSupported: string;
  hobbies: string;
  culturalNeeds: string;
  likes: string;
  dislikes: string;
  aboutOther: string;
  primaryLanguage: string;
  interpreterRequired: string;
  communicationMethod: string;
  medicationRequired: string;
  medicationDetails: string;
  knownAllergies: string;
  medicalHistory: string;
  behaviourSupportRequired: string;
  behaviourDescription: string;
  strategies: string;
  relaxation: string;
  stressCause: string;
  morning: string;
  daytime: string;
  afternoon: string;
  eveningNight: string;
  weekly: string;
  activityAttendance: boolean;
  activityDetails: string;
  personalCare: boolean;
  dressing: string;
  hairCare: string;
  menstrualManagement: string;
  oralHygiene: string;
  nailCare: string;
  shaving: string;
  sleeping: string;
  toiletUse: string;
  showering: string;
  personalCareOther: string;
  householdSupportRequired: boolean;
  cooking: string;
  cleaning: string;
  gardening: string;
  laundry: string;
  makeBed: string;
  grocery: string;
  mobilitySupportRequired: string;
  mobilityDetail: string;
  eatingDrinkingSupport: string;
  dietaryAllergies: string;
  favouriteFoods: string;
  dislikedFoods: string;
  mealOther: string;
  transportArrangements: string;
  financialArrangement: string;
  financialArrangementDetails: string;
  goals: SupportPlanGoalLine[];
  createdBy: string;
  updatedBy: string;
};

export type PlanAssessmentDocument = {
  id: string;
  clientId: string;
  documentNo: string;
  documentType: string;
  planType: string;
  assessmentType: string;
  reviewDate: string;
  dateReceived: string;
  documentStatus: string;
  documentDeveloper: string;
  supportPlanId: string;
};

export type SupportPlanSection = {
  id: string;
  label: string;
  fields: { key: keyof SupportPlanRecord; label: string; type: "text" | "textarea" | "date" | "select" | "checkbox"; optionsKey?: string }[];
};

export const supportPlanSections: SupportPlanSection[] = [
  {
    id: "about",
    label: "About me",
    fields: [
      { key: "importantToMe", label: "What is important to me?", type: "textarea" },
      { key: "howSupported", label: "How I like to be supported", type: "textarea" },
      { key: "hobbies", label: "Hobbies or activities I enjoy", type: "textarea" },
      { key: "culturalNeeds", label: "Cultural and spiritual needs", type: "textarea" },
      { key: "likes", label: "Likes", type: "textarea" },
      { key: "dislikes", label: "Dislikes", type: "textarea" },
      { key: "aboutOther", label: "Other", type: "textarea" },
    ],
  },
  {
    id: "communication",
    label: "Communication & language",
    fields: [
      { key: "primaryLanguage", label: "Primary / preferred language", type: "select", optionsKey: "primaryLanguage" },
      { key: "interpreterRequired", label: "Interpreter required", type: "select", optionsKey: "yesNo" },
      { key: "communicationMethod", label: "Describe communication method", type: "text" },
    ],
  },
  {
    id: "health",
    label: "Health & medical",
    fields: [
      { key: "medicationRequired", label: "Is medication required", type: "select", optionsKey: "yesNo" },
      { key: "medicationDetails", label: "Details", type: "textarea" },
      { key: "knownAllergies", label: "Are there any known allergies", type: "select", optionsKey: "yesNo" },
      { key: "medicalHistory", label: "Medical history", type: "textarea" },
    ],
  },
  {
    id: "behaviour",
    label: "Behaviour",
    fields: [
      { key: "behaviourSupportRequired", label: "Is behaviour support required", type: "select", optionsKey: "yesNo" },
      { key: "behaviourDescription", label: "Behaviour description", type: "textarea" },
      { key: "strategies", label: "Strategies", type: "textarea" },
      { key: "relaxation", label: "Relaxation", type: "textarea" },
      { key: "stressCause", label: "Cause of stress", type: "textarea" },
    ],
  },
  {
    id: "routine",
    label: "My routine",
    fields: [
      { key: "morning", label: "Morning", type: "textarea" },
      { key: "daytime", label: "Daytime", type: "textarea" },
      { key: "afternoon", label: "Afternoon", type: "textarea" },
      { key: "eveningNight", label: "Evening / night", type: "textarea" },
      { key: "weekly", label: "Weekly", type: "textarea" },
      { key: "activityAttendance", label: "Regular activity attendance", type: "checkbox" },
      { key: "activityDetails", label: "Activity details", type: "textarea" },
    ],
  },
  {
    id: "personal-care",
    label: "Personal care",
    fields: [
      { key: "personalCare", label: "Personal care support", type: "checkbox" },
      { key: "dressing", label: "Dressing", type: "textarea" },
      { key: "hairCare", label: "Hair care", type: "textarea" },
      { key: "menstrualManagement", label: "Menstrual management", type: "textarea" },
      { key: "oralHygiene", label: "Oral hygiene", type: "textarea" },
      { key: "nailCare", label: "Nail care", type: "textarea" },
      { key: "shaving", label: "Shaving", type: "textarea" },
      { key: "sleeping", label: "Sleeping", type: "textarea" },
      { key: "toiletUse", label: "Toilet use", type: "textarea" },
      { key: "showering", label: "Showering", type: "textarea" },
      { key: "personalCareOther", label: "Other", type: "textarea" },
    ],
  },
  {
    id: "household",
    label: "Household duties",
    fields: [
      { key: "householdSupportRequired", label: "Household support required", type: "checkbox" },
      { key: "cooking", label: "Cooking", type: "textarea" },
      { key: "cleaning", label: "Cleaning", type: "textarea" },
      { key: "gardening", label: "Gardening", type: "textarea" },
      { key: "laundry", label: "Laundry", type: "textarea" },
      { key: "makeBed", label: "Make bed", type: "textarea" },
      { key: "grocery", label: "Grocery", type: "textarea" },
    ],
  },
  {
    id: "mobility",
    label: "Mobility",
    fields: [
      { key: "mobilitySupportRequired", label: "Mobility support required", type: "select", optionsKey: "yesNo" },
      { key: "mobilityDetail", label: "Mobility detail", type: "textarea" },
    ],
  },
  {
    id: "meals",
    label: "Mealtime management",
    fields: [
      { key: "eatingDrinkingSupport", label: "Support for eating and drinking", type: "select", optionsKey: "yesNo" },
      { key: "dietaryAllergies", label: "Dietary allergies", type: "textarea" },
      { key: "favouriteFoods", label: "Favourite / preferred foods and drinks", type: "textarea" },
      { key: "dislikedFoods", label: "Disliked food / drinks", type: "textarea" },
      { key: "mealOther", label: "Other details", type: "textarea" },
    ],
  },
  {
    id: "transport",
    label: "Transport",
    fields: [{ key: "transportArrangements", label: "Transport arrangements", type: "textarea" }],
  },
  {
    id: "finance",
    label: "Finance",
    fields: [
      { key: "financialArrangement", label: "Financial arrangement", type: "select", optionsKey: "financialArrangement" },
      { key: "financialArrangementDetails", label: "Financial arrangement details", type: "textarea" },
    ],
  },
];

export const initialPlanDocuments: PlanAssessmentDocument[] = [
  {
    id: "pad-1000058",
    clientId: "bp-bern",
    documentNo: "1000058",
    documentType: "Plan",
    planType: "Support Plan",
    assessmentType: "",
    reviewDate: "2023-04-01",
    dateReceived: "",
    documentStatus: "Published",
    documentDeveloper: "Rose Dash",
    supportPlanId: "sp-1000020",
  },
];

export const initialSupportPlans: SupportPlanRecord[] = [
  {
    id: "sp-1000020",
    clientId: "bp-bern",
    documentNo: "1000020",
    description:
      "Active Support Plan — completed with Bernie, signed and provided copy to her. Most recently reviewed May 2022.",
    providedToReceiver: "2022-05-16",
    executionDate: "2022-05-16",
    active: true,
    importantToMe: "My dog Kobe and my best friend Harry.",
    howSupported: "I like to attempt to do things for myself and will request additional support if I need it.",
    hobbies: "Reading and writing",
    culturalNeeds: "N/A",
    likes: "Dogs, beach, dog parks",
    dislikes: "Heights",
    aboutOther: "",
    primaryLanguage: "English",
    interpreterRequired: "No",
    communicationMethod: "",
    medicationRequired: "No",
    medicationDetails: "",
    knownAllergies: "Yes",
    medicalHistory: "Allergic to Hay, only mild and flares up asthma. Uses a puffer as required.",
    behaviourSupportRequired: "No",
    behaviourDescription: "",
    strategies: "",
    relaxation: "",
    stressCause: "",
    morning: "Wake up and brush my teeth, shower. Require support. See manual handling plan",
    daytime: "Attend work",
    afternoon: "relax, play with my dog",
    eveningNight: "cook dinner, watch tv",
    weekly: "Lunch with Harry on Sundays",
    activityAttendance: true,
    activityDetails: "Work weekdays 9-5.",
    personalCare: true,
    dressing: "Assistance to get clothes from cupboard and dress me, I will tell you what I would like to wear",
    hairCare: "I manage this myself, sometimes I may request assistance if my arm is tired.",
    menstrualManagement: "no support required",
    oralHygiene: "no support required",
    nailCare: "",
    shaving: "I can do this myself in the shower",
    sleeping: "",
    toiletUse: "Yes, transfer assistance required",
    showering:
      "Assistance to transfer to my shower chair from wheelchair, I wash myself then need assistance back to my wheelchair",
    personalCareOther: "",
    householdSupportRequired: false,
    cooking: "",
    cleaning: "",
    gardening: "",
    laundry: "",
    makeBed: "",
    grocery: "",
    mobilitySupportRequired: "Yes",
    mobilityDetail:
      "Bernie is in a wheel chair and requires support to get in and out. Manual handling plan details requirements.",
    eatingDrinkingSupport: "No",
    dietaryAllergies: "N/A",
    favouriteFoods: "love cappuccino with almond milk and favourite snack is popcorn",
    dislikedFoods: "Avoids Dairy by choice",
    mealOther: "",
    transportArrangements: "Can catch public transport provided its wheelchair accessible.",
    financialArrangement: "Manages own finances",
    financialArrangementDetails: "manages all financials directly.",
    goals: [
      {
        id: "goal-1",
        lineNo: 1,
        name: "Independently transfer from wheelchair to shower chair",
        goalNumber: "1-One",
        goalTerm: "Medium/Long Term Goal",
        goalType: "NDIS Goal",
        goal: "Independently transfer from wheelchair to shower chair",
        supportRequired:
          "Assist Bernie build upper arm strength and get work with her OT on how to safely transition and build strength.",
        startDate: "2022-06-01",
        endDate: "2024-12-31",
      },
      {
        id: "goal-2",
        lineNo: 2,
        name: "Catch the bus",
        goalNumber: "2-Two",
        goalTerm: "Medium/Long Term Goal",
        goalType: "NDIS Goal",
        goal: "Build courage to catch the bus",
        supportRequired: "Take steps to get familiar with catching a bus and gradually build confidence.",
        startDate: "2022-06-01",
        endDate: "2024-12-31",
      },
      {
        id: "goal-3",
        lineNo: 3,
        name: "New wheelchair",
        goalNumber: "3-Three",
        goalTerm: "Short Term Goal",
        goalType: "NDIS Goal",
        goal: "Get a new wheelchair",
        supportRequired: "Ensure Bernie can have her OT appointments and review options.",
        startDate: "2022-06-01",
        endDate: "2024-12-31",
      },
    ],
    createdBy: "Isla Robinson",
    updatedBy: "Oliver Williams",
  },
];

export function normalizeSupportPlan(record: SupportPlanRecord): SupportPlanRecord {
  return {
    ...record,
    goals: record.goals.map((g, i) => ({ ...g, lineNo: g.lineNo ?? i + 1 })),
  };
}
