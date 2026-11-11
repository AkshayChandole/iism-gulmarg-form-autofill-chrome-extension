// Shared field definitions: key, label, page element id, kind.
const TEXT_FIELDS = [
  { key: 'name', label: "Name", id: 'txtName' },
  { key: 'fatherName', label: "Father's name", id: 'txtFatherName' },
  { key: 'nationality', label: 'Nationality', id: 'txtNationality' },
  { key: 'domicile', label: 'Domicile', id: 'txtDomicile' },
  { key: 'house', label: 'House no/apartment', id: 'txtHouseNoApartment' },
  { key: 'street', label: 'Street/village/colony', id: 'txtStreetVillageColony' },
  { key: 'city', label: 'District/city', id: 'txtDistrictCity' },
  { key: 'pincode', label: 'PIN code', id: 'txtPincode' },
  { key: 'mobile', label: 'Mobile (blank = keep URL value)', id: 'txtMobileNo' },
  { key: 'email', label: 'Email', id: 'txtEmailId' },
  { key: 'bloodGroup', label: 'Blood group', id: 'txtBloodGroup' },
  { key: 'medicalCategory', label: 'Medical category', id: 'txtMedicalCategory' },
  { key: 'height', label: 'Height', id: 'txtHeight' },
  { key: 'weight', label: 'Weight', id: 'txtWeight' },
  { key: 'waist', label: 'Waist', id: 'txtWaist' },
  { key: 'shoeSize', label: 'Shoe size', id: 'txtShoeSize' },
  { key: 'emergencyName', label: 'Emergency contact name', id: 'txtEmergencyContactName' },
  { key: 'emergencyPhone', label: 'Emergency contact phone', id: 'txtEmergencyContactPhone' },
];

// Dropdowns that trigger a postback, in the order they must be set.
const CHAIN_SELECTS = [
  { key: 'course', label: 'Course (text match)', id: 'ddlCourse', dependent: 'ddlCourseLevel' },
  { key: 'level', label: 'Course level (text match, blank = first)', id: 'ddlCourseLevel', dependent: 'ddlScheduleCourse' },
  { key: 'schedule', label: 'Schedule (text match, blank = first)', id: 'ddlScheduleCourse', dependent: null },
  { key: 'state', label: 'State (text match)', id: 'ddlState', dependent: null },
];

const PLAIN_SELECTS = [
  { key: 'education', label: 'Education qualification', id: 'ddlEduationQualification',
    options: ['High School', 'Intermediate', 'Graduation', 'Post graduation'] },
  { key: 'diet', label: 'Vegetarian/non-vegetarian', id: 'ddlVegetarianOrNon',
    options: ['Vegetarian', 'Non-Vegetarian'] },
];

const FILE_FIELDS = [
  { key: 'birthCert', label: 'Birth certificate', id: 'FupBirthCertificate' },
  { key: 'domicileProof', label: 'Domicile proof', id: 'FupDomicileAttachProof' },
  { key: 'educationProof', label: 'Education qualification', id: 'FupEducationQualification' },
  { key: 'adventurePhoto', label: 'Adventure course photo', id: 'FupAnyAdventureCoursePhoto' },
  { key: 'photo', label: 'Photo of applicant', id: 'FupPhototOfApplicant' },
  { key: 'signature', label: 'Signature of applicant', id: 'FupSignatureOfAppicant' },
  { key: 'parentSignature', label: "Parent/guardian's signature", id: 'FupParentGuardianSignature' },
];

// Fields the form marks as required (parentSignature only when under 18).
const REQUIRED_KEYS = [
  'course', 'level', 'schedule', 'state', 'name', 'fatherName', 'nationality', 'dob',
  'house', 'street', 'city', 'pincode', 'mobile', 'email', 'education', 'diet', 'bloodGroup',
  'emergencyName', 'emergencyPhone',
  'birthCert', 'educationProof', 'photo', 'signature',
];

const FILE_RULES = { maxBytes: 500 * 1024, types: ['image/jpeg', 'image/png'], label: '.jpg, .jpeg or .png, max 500 KB' };

// Age in whole years from a dd/MM/yyyy string, or null if unparseable.
function ageFromDob(dob) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob || '');
  if (!m) return null;
  const now = new Date();
  let age = now.getFullYear() - Number(m[3]);
  const before = now.getMonth() + 1 < Number(m[2]) || (now.getMonth() + 1 === Number(m[2]) && now.getDate() < Number(m[1]));
  return before ? age - 1 : age;
}
