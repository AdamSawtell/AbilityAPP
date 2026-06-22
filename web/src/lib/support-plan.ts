export type SupportPlanGoalLine = {
  id: string;
  lineNo: number;
  name: string;
  goalNumber: string;
  goalTerm: string;
  goalType: string;
  goal: string;
  supportRequired: string;
  ndisCategory: string;
  whyItMatters: string;
  successMeasures: string;
  startDate: string;
  endDate: string;
};

export type SupportPlanMedicationLine = {
  id: string;
  lineNo: number;
  medicationName: string;
  dosage: string;
  purpose: string;
  administrationRequirements: string;
};

export type SupportPlanDiagnosisLine = {
  id: string;
  lineNo: number;
  diagnosis: string;
  condition: string;
  treatingPractitioner: string;
  impactOnDailyLiving: string;
};

export type SupportPlanHealthPlanLine = {
  id: string;
  lineNo: number;
  planType: string;
  attachmentReference: string;
  notes: string;
};

export type SupportPlanSupportRequirementLine = {
  id: string;
  lineNo: number;
  supportArea: string;
  supportRequirement: string;
  levelOfAssistance: string;
  frequency: string;
  specialInstructions: string;
};

export type SupportPlanAssistiveTechnologyLine = {
  id: string;
  lineNo: number;
  equipment: string;
  serialNumber: string;
  maintenanceSchedule: string;
  trainingRequired: string;
};

export type SupportPlanProgressReviewLine = {
  id: string;
  lineNo: number;
  goalId: string;
  goalName: string;
  progressReviewType: string;
  reviewDate: string;
  goalProgress: string;
  progressTaken: string;
  receiverFeeling: string;
  nextSteps: string;
  createdBy: string;
  updatedBy: string;
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
  importantForMe: string;
  myStory: string;
  howSupported: string;
  hobbies: string;
  culturalNeeds: string;
  religiousRequirements: string;
  familyInformation: string;
  pets: string;
  strengths: string;
  skills: string;
  aspirations: string;
  likes: string;
  dislikes: string;
  aboutOther: string;
  primaryLanguage: string;
  interpreterRequired: string;
  communicationMethod: string;
  verbalCommunicationLevel: string;
  nonVerbalCommunication: string;
  communicationAids: string;
  communicationTriggers: string;
  calmingStrategies: string;
  workerGuidance: string;
  medicationRequired: string;
  medicationDetails: string;
  knownAllergies: string;
  medicalHistory: string;
  behaviourSupportRequired: string;
  behaviourPractitioner: string;
  behaviourAuthorisations: string;
  behaviourDescription: string;
  strategies: string;
  relaxation: string;
  stressCause: string;
  emergencyMedicalProcedure: string;
  emergencyMissingPersonProcedure: string;
  emergencyBehaviouralCrisisProcedure: string;
  emergencyFireEvacuationProcedure: string;
  whatWorksBest: string;
  workerApproaches: string;
  environmentalConsiderations: string;
  avoidList: string;
  unsafePractices: string;
  shiftArrivalProcess: string;
  shiftDepartureProcess: string;
  documentationRequirements: string;
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
  medications: SupportPlanMedicationLine[];
  diagnoses: SupportPlanDiagnosisLine[];
  healthPlans: SupportPlanHealthPlanLine[];
  supportRequirements: SupportPlanSupportRequirementLine[];
  assistiveTechnology: SupportPlanAssistiveTechnologyLine[];
  progressReviews: SupportPlanProgressReviewLine[];
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
      { key: "myStory", label: "My story", type: "textarea" },
      { key: "importantToMe", label: "What is important to me?", type: "textarea" },
      { key: "importantForMe", label: "What is important for me?", type: "textarea" },
      { key: "howSupported", label: "How I like to be supported", type: "textarea" },
      { key: "culturalNeeds", label: "Cultural requirements", type: "textarea" },
      { key: "religiousRequirements", label: "Religious requirements", type: "textarea" },
      { key: "familyInformation", label: "Family information", type: "textarea" },
      { key: "pets", label: "Pets", type: "textarea" },
      { key: "hobbies", label: "Hobbies or activities I enjoy", type: "textarea" },
      { key: "strengths", label: "Strengths", type: "textarea" },
      { key: "skills", label: "Skills", type: "textarea" },
      { key: "aspirations", label: "Aspirations", type: "textarea" },
      { key: "likes", label: "Things I enjoy", type: "textarea" },
      { key: "dislikes", label: "Things I don't like", type: "textarea" },
      { key: "aboutOther", label: "Other", type: "textarea" },
    ],
  },
  {
    id: "communication",
    label: "Communication & language",
    fields: [
      { key: "primaryLanguage", label: "Primary / preferred language", type: "select", optionsKey: "primaryLanguage" },
      { key: "interpreterRequired", label: "Interpreter required", type: "select", optionsKey: "yesNo" },
      { key: "communicationMethod", label: "Preferred communication method", type: "text" },
      { key: "verbalCommunicationLevel", label: "Verbal communication level", type: "text" },
      { key: "nonVerbalCommunication", label: "Non-verbal communication", type: "textarea" },
      { key: "communicationAids", label: "Communication aids", type: "textarea" },
      { key: "communicationTriggers", label: "Triggers", type: "textarea" },
      { key: "calmingStrategies", label: "Calming strategies", type: "textarea" },
      { key: "workerGuidance", label: "Worker guidance", type: "textarea" },
    ],
  },
  {
    id: "health",
    label: "Health & medical",
    fields: [
      { key: "medicationRequired", label: "Is medication required", type: "select", optionsKey: "yesNo" },
      { key: "medicationDetails", label: "Medication summary (legacy)", type: "textarea" },
      { key: "knownAllergies", label: "Are there any known allergies", type: "select", optionsKey: "yesNo" },
      { key: "medicalHistory", label: "Medical history summary", type: "textarea" },
    ],
  },
  {
    id: "behaviour",
    label: "Behaviour",
    fields: [
      { key: "behaviourSupportRequired", label: "Is behaviour support required", type: "select", optionsKey: "yesNo" },
      { key: "behaviourPractitioner", label: "Practitioner", type: "text" },
      { key: "behaviourAuthorisations", label: "Authorisations", type: "textarea" },
      { key: "behaviourDescription", label: "Behaviour description", type: "textarea" },
      { key: "strategies", label: "Positive behaviour supports", type: "textarea" },
      { key: "relaxation", label: "De-escalation / relaxation", type: "textarea" },
      { key: "stressCause", label: "Triggers", type: "textarea" },
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
  {
    id: "emergency",
    label: "Emergency",
    fields: [
      { key: "emergencyMedicalProcedure", label: "Medical emergency", type: "textarea" },
      { key: "emergencyMissingPersonProcedure", label: "Missing person", type: "textarea" },
      { key: "emergencyBehaviouralCrisisProcedure", label: "Behavioural crisis", type: "textarea" },
      { key: "emergencyFireEvacuationProcedure", label: "Fire evacuation", type: "textarea" },
    ],
  },
  {
    id: "worker-instructions",
    label: "Worker instructions",
    fields: [
      { key: "whatWorksBest", label: "What works best", type: "textarea" },
      { key: "workerApproaches", label: "Worker approaches", type: "textarea" },
      { key: "environmentalConsiderations", label: "Environmental considerations", type: "textarea" },
      { key: "avoidList", label: "Avoid", type: "textarea" },
      { key: "unsafePractices", label: "Unsafe practices", type: "textarea" },
      { key: "shiftArrivalProcess", label: "Arrival process", type: "textarea" },
      { key: "shiftDepartureProcess", label: "Departure process", type: "textarea" },
      { key: "documentationRequirements", label: "Documentation requirements", type: "textarea" },
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
    myStory:
      "Acquired physical disabilities as a result of car accident in 2004. Bernie lost her right leg from the knee down and has a spinal cord injury limiting movement of her left leg. She is in a wheelchair.",
    importantToMe: "My dog Kobe and my best friend Harry.",
    importantForMe: "Staying safe at home, maintaining friendships, and building independence with transfers.",
    howSupported: "I like to attempt to do things for myself and will request additional support if I need it.",
    hobbies: "Reading and writing",
    culturalNeeds: "Australian cultural affiliation",
    religiousRequirements: "N/A",
    familyInformation: "Close friend Harry — Sunday lunch contact.",
    pets: "Dog named Kobe",
    strengths: "Determined, friendly, good sense of humour",
    skills: "Reading, writing, cooking with support",
    aspirations: "Independent transfers, catching the bus, new wheelchair",
    likes: "Dogs, beach, dog parks",
    dislikes: "Heights",
    aboutOther: "",
    primaryLanguage: "English",
    interpreterRequired: "No",
    communicationMethod: "Clear verbal communication; prefers direct questions",
    verbalCommunicationLevel: "Fully verbal",
    nonVerbalCommunication: "Uses gestures when tired",
    communicationAids: "",
    communicationTriggers: "Rushed instructions; being spoken over",
    calmingStrategies: "Quiet space, time to process, familiar routines",
    workerGuidance: "Allow time to respond. Confirm understanding before starting tasks.",
    medicationRequired: "No",
    medicationDetails: "",
    knownAllergies: "Yes",
    medicalHistory: "Allergic to Hay, only mild and flares up asthma. Uses a puffer as required.",
    behaviourSupportRequired: "No",
    behaviourPractitioner: "",
    behaviourAuthorisations: "",
    behaviourDescription: "",
    strategies: "",
    relaxation: "",
    stressCause: "",
    emergencyMedicalProcedure: "Call 000 for medical emergency. Asthma puffer in kitchen drawer.",
    emergencyMissingPersonProcedure: "Contact Harry (0411 222 333) and management immediately.",
    emergencyBehaviouralCrisisProcedure: "N/A — no behaviour support plan",
    emergencyFireEvacuationProcedure: "Evacuate via rear ramp. Assembly point at front of building.",
    whatWorksBest: "Attempt tasks independently first; offer help when asked.",
    workerApproaches: "Patient, respectful, explain each step before physical support.",
    environmentalConsiderations: "Wheelchair access via rear ramp. Level entry to kitchen and bathroom.",
    avoidList: "Heights, dairy products by choice",
    unsafePractices: "Do not rush transfers; follow manual handling plan.",
    shiftArrivalProcess: "Knock, greet Bernie, check dog is secure before transfers.",
    shiftDepartureProcess: "Confirm evening routine complete; note any changes in progress review.",
    documentationRequirements: "Record progress on goals and any incident or near miss.",
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
    medications: [
      {
        id: "med-bern-1",
        lineNo: 1,
        medicationName: "Salbutamol puffer",
        dosage: "2 puffs as required",
        purpose: "Asthma / hay allergy",
        administrationRequirements: "Stored in kitchen drawer. Support worker to remind if wheezing.",
      },
    ],
    diagnoses: [
      {
        id: "dx-bern-1",
        lineNo: 1,
        diagnosis: "Spinal cord injury",
        condition: "Limited left leg movement; wheelchair user",
        treatingPractitioner: "GP — Dr Adams",
        impactOnDailyLiving: "Requires transfer assistance for shower and toilet.",
      },
      {
        id: "dx-bern-2",
        lineNo: 2,
        diagnosis: "Hay allergy / mild asthma",
        condition: "Seasonal",
        treatingPractitioner: "GP — Dr Adams",
        impactOnDailyLiving: "Avoid hay exposure; puffer as required.",
      },
    ],
    healthPlans: [
      {
        id: "hp-bern-1",
        lineNo: 1,
        planType: "Medication plan",
        attachmentReference: "Manual handling plan on file",
        notes: "See OT manual handling plan for transfers.",
      },
    ],
    supportRequirements: [
      {
        id: "req-bern-1",
        lineNo: 1,
        supportArea: "Personal care — showering",
        supportRequirement: "Transfer to shower chair and back",
        levelOfAssistance: "Partial assistance",
        frequency: "Daily",
        specialInstructions: "Follow manual handling plan. Bernie washes herself.",
      },
      {
        id: "req-bern-2",
        lineNo: 2,
        supportArea: "Personal care — dressing",
        supportRequirement: "Clothes from cupboard and dressing",
        levelOfAssistance: "Partial assistance",
        frequency: "Daily",
        specialInstructions: "Bernie chooses outfit.",
      },
      {
        id: "req-bern-3",
        lineNo: 3,
        supportArea: "Community access — transport",
        supportRequirement: "Wheelchair-accessible public transport",
        levelOfAssistance: "Prompting",
        frequency: "As needed",
        specialInstructions: "Build confidence gradually for bus travel goal.",
      },
    ],
    assistiveTechnology: [
      {
        id: "at-bern-1",
        lineNo: 1,
        equipment: "Wheelchair",
        serialNumber: "WC-2019-4421",
        maintenanceSchedule: "Annual service with OT",
        trainingRequired: "Manual handling plan training for all workers",
      },
    ],
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
        ndisCategory: "Daily living",
        whyItMatters: "Independence and dignity in personal care",
        successMeasures: "Safe transfer with minimal assistance; OT sign-off",
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
        ndisCategory: "Social and community participation",
        whyItMatters: "Community access and independence",
        successMeasures: "Uses accessible bus route independently once per week",
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
        ndisCategory: "Assistive technology",
        whyItMatters: "Mobility, posture, and daily function",
        successMeasures: "New wheelchair prescribed, funded, and delivered",
        startDate: "2022-06-01",
        endDate: "2024-12-31",
      },
    ],
    progressReviews: [
      {
        id: "pr-goal-1",
        lineNo: 1,
        goalId: "goal-1",
        goalName: "Independently transfer from wheelchair to shower chair",
        progressReviewType: "Progress Review",
        reviewDate: "2023-04-01",
        goalProgress: "Some Progress",
        progressTaken: "Bernie is building upper arm strength with OT sessions fortnightly.",
        receiverFeeling: "Feels encouraged and wants to keep working on transfers.",
        nextSteps: "Continue OT and review manual handling plan in June.",
        createdBy: "Isla Robinson",
        updatedBy: "Isla Robinson",
      },
    ],
    createdBy: "Isla Robinson",
    updatedBy: "Oliver Williams",
  },
];

export function normalizeSupportPlan(record: SupportPlanRecord): SupportPlanRecord {
  const goals = (record.goals ?? []).map((g, i) => ({ ...g, lineNo: g.lineNo ?? i + 1 }));
  const goalNameById = Object.fromEntries(goals.map((g) => [g.id, g.name || g.goal]));
  const progressReviews = (record.progressReviews ?? []).map((row, i) => ({
    ...row,
    lineNo: row.lineNo ?? i + 1,
    goalName: row.goalName || goalNameById[row.goalId] || "",
  }));
  const medications = (record.medications ?? []).map((row, i) => ({ ...row, lineNo: row.lineNo ?? i + 1 }));
  const diagnoses = (record.diagnoses ?? []).map((row, i) => ({ ...row, lineNo: row.lineNo ?? i + 1 }));
  const healthPlans = (record.healthPlans ?? []).map((row, i) => ({ ...row, lineNo: row.lineNo ?? i + 1 }));
  const supportRequirements = (record.supportRequirements ?? []).map((row, i) => ({ ...row, lineNo: row.lineNo ?? i + 1 }));
  const assistiveTechnology = (record.assistiveTechnology ?? []).map((row, i) => ({ ...row, lineNo: row.lineNo ?? i + 1 }));
  return {
    ...record,
    myStory: record.myStory ?? "",
    importantForMe: record.importantForMe ?? "",
    religiousRequirements: record.religiousRequirements ?? "",
    familyInformation: record.familyInformation ?? "",
    pets: record.pets ?? "",
    strengths: record.strengths ?? "",
    skills: record.skills ?? "",
    aspirations: record.aspirations ?? "",
    verbalCommunicationLevel: record.verbalCommunicationLevel ?? "",
    nonVerbalCommunication: record.nonVerbalCommunication ?? "",
    communicationAids: record.communicationAids ?? "",
    communicationTriggers: record.communicationTriggers ?? "",
    calmingStrategies: record.calmingStrategies ?? "",
    workerGuidance: record.workerGuidance ?? "",
    behaviourPractitioner: record.behaviourPractitioner ?? "",
    behaviourAuthorisations: record.behaviourAuthorisations ?? "",
    emergencyMedicalProcedure: record.emergencyMedicalProcedure ?? "",
    emergencyMissingPersonProcedure: record.emergencyMissingPersonProcedure ?? "",
    emergencyBehaviouralCrisisProcedure: record.emergencyBehaviouralCrisisProcedure ?? "",
    emergencyFireEvacuationProcedure: record.emergencyFireEvacuationProcedure ?? "",
    whatWorksBest: record.whatWorksBest ?? "",
    workerApproaches: record.workerApproaches ?? "",
    environmentalConsiderations: record.environmentalConsiderations ?? "",
    avoidList: record.avoidList ?? "",
    unsafePractices: record.unsafePractices ?? "",
    shiftArrivalProcess: record.shiftArrivalProcess ?? "",
    shiftDepartureProcess: record.shiftDepartureProcess ?? "",
    documentationRequirements: record.documentationRequirements ?? "",
    goals,
    progressReviews,
    medications,
    diagnoses,
    healthPlans,
    supportRequirements,
    assistiveTechnology,
  };
}
