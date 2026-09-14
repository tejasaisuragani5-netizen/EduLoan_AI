"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";


type Student = {
  id: number;
  student_id: string;
  name: string;
  course: string;
  year: string;
  admission_year: string;
  total_fee: number;
};


type DocumentRequest = {
  id: number;
  student_id: string;
  student_name: string;
  document_type: string;
  description: string;
  request_date: string;
  status: string;
};


type StudentForm = {
  student_id: string;
  name: string;
  course: string;
  year: string;
  admission_year: string;
  total_fee: string;
};


type DocumentRecord = {
  id: number;
  request_id: number;
  student_id: string;
  student_name: string;
  document_type: string;
  verification_code: string;
  issued_date: string;
};


type Disbursement = {
  id: number;
  student_id: string;
  student_name: string;
  bank_name: string;
  loan_amount: number;
  disbursed_date: string;
  reconciled: number;
  total_fee: number;
  total_received: number;
  fee_status: string;
};


type ReportSummary = {
  total_students: number;
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  documents_issued: number;
  total_disbursed: number;
};


type TurnaroundStat = {
  document_type: string;
  count: number;
  average_days: number;
};


type VerifyResult = {
  valid: boolean;
  document_type: string;
  student_name: string;
  student_id: string;
  course: string;
  issued_date: string;
  verification_code: string;
};

type ScorecardItem = {
  label: string;
  value: string;
  status: "pass" | "fail" | "warn";
};

type BarcodeStudent = {
  id?: number;
  student_id: string;
  name: string;
  course: string;
  year: string;
  admission_year: string;
  total_fee: number;
};

type BarcodeInfo = {
  detected: boolean;
  code: string | null;
  matched: boolean;
  source?: string;
  student?: BarcodeStudent | null;
  document_type?: string;
};

type BarcodeScanResponse = {
  success: boolean;
  barcode: string | null;
  all_codes?: string[];
  student: BarcodeStudent | null;
  message: string;
};

type AIVerificationResult = {
  id: number;
  student_id: string;
  student_name?: string;
  document_type: string;
  filename: string;
  ai_verdict: "VERIFIED" | "REJECTED" | "REVIEW" | "REAL" | "FAKE";
  confidence: number;
  reason: string;
  extracted_text: string;
  ai_engine?: string;
  status: "Approved" | "Rejected" | "Manual Review";
  message: string;
  scorecard?: ScorecardItem[];
  scorecard_text?: string;
  barcode_info?: BarcodeInfo | null;
};

type AIStatus = {
  provider: string;
  model: string;
  has_api_key: boolean;
  masked_key: string;
  active_engine: string;
  mode: string;
  ready: boolean;
};

type VerificationRequest = AIVerificationResult & {
  student_name: string;
  course: string;
  file_path: string;
  created_at: string;
};



export default function Home() {

  const [activePage, setActivePage] = useState("Dashboard");

  const [students, setStudents] = useState<Student[]>([]);

  const [requests, setRequests] = useState<DocumentRequest[]>([]);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");


  const [studentForm, setStudentForm] =
    useState<StudentForm>({
      student_id: "",
      name: "",
      course: "",
      year: "",
      admission_year: "",
      total_fee: ""
    });


  const [bankRequirements, setBankRequirements] = useState([]);

  const [requestForm, setRequestForm] = useState({
    student_id: "",
    document_type: "",
    description: ""
  });


  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  const [disbursements, setDisbursements] =
    useState<Disbursement[]>([]);

  const [disbursementForm, setDisbursementForm] = useState({
    student_id: "",
    bank_name: "",
    loan_amount: "",
    disbursed_date: "",
    notes: ""
  });

  const [reportSummary, setReportSummary] =
    useState<ReportSummary | null>(null);

  const [turnaroundStats, setTurnaroundStats] =
    useState<TurnaroundStat[]>([]);

  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verifyResult, setVerifyResult] =
    useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationStudentId, setVerificationStudentId] = useState("");
  const [isCustomStudentId, setIsCustomStudentId] = useState(false);
  const [customStudentId, setCustomStudentId] = useState("");
  const [showRawScorecard, setShowRawScorecard] = useState(false);
  const [copiedScorecard, setCopiedScorecard] = useState(false);
  const [selectedScorecardModal, setSelectedScorecardModal] = useState<VerificationRequest | null>(null);
  const [verificationDocumentType, setVerificationDocumentType] = useState("");
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verificationBackFile, setVerificationBackFile] = useState<File | null>(null);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [scannedBarcodeData, setScannedBarcodeData] = useState<BarcodeScanResponse | null>(null);
  const [barcodeScanError, setBarcodeScanError] = useState("");
  const [generatingRegNo, setGeneratingRegNo] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] =
    useState<AIVerificationResult | null>(null);
  const [verificationRequests, setVerificationRequests] =
    useState<VerificationRequest[]>([]);
  const [aiVerifying, setAiVerifying] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiModelInput, setApiModelInput] = useState("gemini-1.5-flash");
  const [testingKey, setTestingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState("");
  const [botInput, setBotInput] = useState("");
  const [botResponse, setBotResponse] = useState<string>(
    "Hello Admin! Agent 43 is active and monitoring education loan verification pipelines for Vignan's students."
  );
  const [botLoading, setBotLoading] = useState(false);
  const [refreshingRadar, setRefreshingRadar] = useState(false);

  const handleAskBot = (query?: string) => {
    const prompt = (query || botInput).trim();
    if (!prompt) return;
    setBotLoading(true);
    setTimeout(() => {
      const q = prompt.toLowerCase();
      let reply = "";
      if (q.includes("student") || q.includes("total")) {
        reply = `There are ${students.length} students currently registered in Vignan's database.`;
      } else if (q.includes("request") || q.includes("pending")) {
        const pending = requests.filter((r) => r.status === "Pending").length;
        const approved = requests.filter((r) => r.status === "Approved").length;
        reply = `Current requests: ${pending} Pending issue, ${approved} Approved.`;
      } else if (q.includes("verify") || q.includes("verification") || q.includes("scan") || q.includes("fraud")) {
        reply = `Agent 43 processed ${verificationRequests.length} document verification scans. Engine: ${aiStatus?.active_engine || "AI Active"} (Model: ${aiStatus?.model || "gemini-1.5-flash"}).`;
      } else if (q.includes("disburse") || q.includes("loan") || q.includes("money") || q.includes("amount")) {
        const total = disbursements.reduce((acc, d) => acc + (d.loan_amount || 0), 0);
        reply = `Total loan disbursement recorded: ₹${total.toLocaleString("en-IN")} across ${disbursements.length} records.`;
      } else if (q.includes("stamp") || q.includes("seal") || q.includes("college")) {
        reply = `Official College Seal: Vignan's Foundation for Science, Technology & Research (VFSTR) digital circular seal & security watermark are attached to all generated certificates.`;
      } else {
        reply = `Agent 43 Status: All loan verification services, ReportLab stamp generator, and AI fraud models are operational for Vignan University.`;
      }
      setBotResponse(reply);
      setBotLoading(false);
      if (!query) setBotInput("");
    }, 400);
  };

  const handleRefreshRadar = async () => {
    setRefreshingRadar(true);
    try {
      await Promise.all([
        loadStudents(),
        loadRequests(),
        loadBankRequirements(),
        loadDocuments(),
        loadVerificationRequests(),
        loadDisbursements(),
        loadReports(),
        loadAiStatus(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setRefreshingRadar(false), 450);
    }
  };

  // =================================================
  // LOAD STUDENTS
  // =================================================

  const loadStudents = async () => {

    try {

      const response = await fetch(
        `${API_URL}/students`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load students");
      }

      setStudents(data);

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to connect to backend."
      );
    }
  };


  // =================================================
  // LOAD DOCUMENT REQUESTS
  // =================================================

  const loadRequests = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/document-requests`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          "Failed to load document requests"
        );
      }

      setRequests(data);

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to load document requests."
      );

    } finally {

      setLoading(false);

    }
  };


  // =================================================
  // LOAD DATA
  // =================================================

  useEffect(() => {

    loadStudents();

    loadRequests();
    loadBankRequirements();
    loadDocuments();
    loadVerificationRequests();
    loadDisbursements();
    loadReports();
    loadAiStatus();

  }, []);


  // =================================================
  // STUDENT FORM & DYNAMIC VFSTR REG NO
  // =================================================

  const autoGenerateRegNo = async (yearVal?: string, courseVal?: string) => {
    const admYear = yearVal || studentForm.admission_year || new Date().getFullYear().toString();
    const course = courseVal || studentForm.course || "CSE";
    try {
      setGeneratingRegNo(true);
      const res = await fetch(
        `${API_URL}/students/next-reg-no?admission_year=${encodeURIComponent(admYear)}&course=${encodeURIComponent(course)}`
      );
      if (res.ok) {
        const data = await res.json();
        const regNo = data.student_id || data.suggested_student_id;
        if (regNo) {
          setStudentForm((prev) => ({
            ...prev,
            student_id: regNo,
            admission_year: admYear,
          }));
        }
      }
    } catch (e) {
      console.error("Failed to generate VFSTR reg no:", e);
    } finally {
      setGeneratingRegNo(false);
    }
  };

  const handleStudentChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {

    const { name, value } = event.target;

    setStudentForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };


  // =================================================
  // ADD STUDENT
  // =================================================

  const addStudent = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setMessage("");


    if (
      !studentForm.student_id ||
      !studentForm.name ||
      !studentForm.course ||
      !studentForm.year ||
      !studentForm.admission_year ||
      !studentForm.total_fee
    ) {

      setMessage(
        "Please fill all student fields."
      );

      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/students`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            student_id: studentForm.student_id,
            name: studentForm.name,
            course: studentForm.course,
            year: studentForm.year,
            admission_year:
              studentForm.admission_year,
            total_fee:
              Number(studentForm.total_fee)
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setMessage(
          data.detail ||
          "Unable to add student."
        );

        return;
      }


      setMessage(
        "Student added successfully."
      );


      setStudentForm({
        student_id: "",
        name: "",
        course: "",
        year: "",
        admission_year: "",
        total_fee: ""
      });


      await loadStudents();


    } catch (error) {

      console.error(error);

      setMessage(
        "Backend connection failed."
      );

    }

  };


  // =================================================
  // DELETE STUDENT
  // =================================================

  const deleteStudent = async (
    studentId: string
  ) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );


    if (!confirmed) {
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/students/${studentId}`,
        {
          method: "DELETE"
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setMessage(
          data.detail ||
          "Unable to delete student."
        );

        return;
      }


      setMessage(
        "Student and all linked verification, request & disbursement records deleted successfully."
      );


      await Promise.all([
        loadStudents(),
        loadRequests(),
        loadDocuments(),
        loadVerificationRequests(),
        loadDisbursements(),
        loadReports(),
      ]);


    } catch (error) {

      console.error(error);

      setMessage(
        "Backend connection failed."
      );

    }

  };


  // =================================================
  // DOCUMENT REQUEST FORM
  // =================================================

  const handleRequestChange = (
    event: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {

    const { name, value } = event.target;

    setRequestForm({
      ...requestForm,
      [name]: value
    });

  };


  // =================================================
  // CREATE DOCUMENT REQUEST
  // =================================================

  const createRequest = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setMessage("");


    if (
      !requestForm.student_id ||
      !requestForm.document_type
    ) {

      setMessage(
        "Please select a student and document type."
      );

      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/document-requests`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            student_id:
              requestForm.student_id,

            document_type:
              requestForm.document_type,

            description:
              requestForm.description
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setMessage(
          data.detail ||
          "Unable to create request."
        );

        return;
      }


      setMessage(
        "Document request created successfully."
      );


      setRequestForm({
        student_id: "",
        document_type: "",
        description: ""
      });


      await loadRequests();


    } catch (error) {

      console.error(error);

      setMessage(
        "Backend connection failed."
      );

    }

  };


  // =================================================
  // UPDATE REQUEST STATUS
  // =================================================

  const updateRequestStatus = async (
    requestId: number,
    status: string
  ) => {

    try {

      const response = await fetch(
        `${API_URL}/document-requests/${requestId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            status: status
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setMessage(
          data.detail ||
          "Unable to update request."
        );

        return;
      }


      setMessage(
        `Request ${status.toLowerCase()} successfully.`
      );


      await loadRequests();


    } catch (error) {

      console.error(error);

      setMessage(
        "Backend connection failed."
      );

    }

  };


  // =================================================
  const loadBankRequirements = async () => {
    try {
      const response = await fetch(`${API_URL}/bank-requirements`);
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to load bank requirements");
      setBankRequirements(data);
    } catch (error) {
      console.error(error);
    }
  };

  // =================================================
  // LOAD DOCUMENTS
  // =================================================

  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`);
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to load documents");
      setDocuments(data);
    } catch (error) {
      console.error(error);
    }
  };


  // =================================================
  // GENERATE DOCUMENT
  // =================================================

  const generateDocument = async (requestId: number) => {

    setMessage("");

    try {

      const response = await fetch(
        `${API_URL}/documents/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_id: requestId })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Unable to generate document.");
        return;
      }

      setMessage(
        `Document generated. Verification code: ${data.verification_code}`
      );

      await loadDocuments();
      await loadRequests();
      await loadReports();

    } catch (error) {
      console.error(error);
      setMessage("Backend connection failed.");
    }
  };


  const downloadDocument = (documentId: number) => {
    window.open(
      `${API_URL}/documents/${documentId}/download`,
      "_blank"
    );
  };


  // =================================================
  // VERIFICATION
  // =================================================

  const verifyDocumentCode = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setVerifyResult(null);
    setVerifyError("");

    if (!verifyCodeInput.trim()) {
      setVerifyError("Enter a verification code.");
      return;
    }

    try {

      setVerifying(true);

      const response = await fetch(
        `${API_URL}/verify/${encodeURIComponent(verifyCodeInput.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        setVerifyError(data.detail || "Invalid verification code.");
        return;
      }

      setVerifyResult(data);

    } catch (error) {
      console.error(error);
      setVerifyError("Backend connection failed.");
    } finally {
      setVerifying(false);
    }
  };



  // =================================================
  // AI PHOTO VERIFICATION & CONFIG
  // =================================================

  const loadAiStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/ai/status`);
      if (response.ok) {
        const data: AIStatus = await response.json();
        setAiStatus(data);
        if (data.model) setApiModelInput(data.model);
      }
    } catch (error) {
      console.error("Failed to load AI status:", error);
    }
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingKey(true);
    setKeyFeedback("");

    try {
      const res = await fetch(`${API_URL}/ai/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: apiKeyInput,
          gemini_model: apiModelInput
        })
      });
      const data = await res.json();
      setAiStatus(data);

      if (data.has_api_key) {
        setKeyFeedback("✓ Gemini API key saved! Live Gemini Vision AI is active.");
      } else {
        setKeyFeedback("✓ Configuration saved. Using Built-in Intelligent Verification Engine.");
      }
    } catch (err) {
      setKeyFeedback("Failed to update AI settings.");
    } finally {
      setTestingKey(false);
    }
  };

  const handleTestAiKey = async () => {
    setTestingKey(true);
    setKeyFeedback("Testing connection with Google Gemini...");
    try {
      const res = await fetch(`${API_URL}/ai/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: apiKeyInput,
          gemini_model: apiModelInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setKeyFeedback(`✓ ${data.message}`);
      } else {
        setKeyFeedback(`Note: ${data.message}`);
      }
    } catch (err) {
      setKeyFeedback("Connection test failed. Backend may be offline.");
    } finally {
      setTestingKey(false);
    }
  };

  const loadVerificationRequests = async () => {
    try {
      const response = await fetch(
        `${API_URL}/verification/requests`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load verification requests");
      }

      setVerificationRequests(data);
    } catch (error) {
      console.error(error);
    }
  };


  const copyScorecardToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedScorecard(true);
    setTimeout(() => setCopiedScorecard(false), 2500);
  };

  const handleBackFileChange = async (file: File | null) => {
    setVerificationBackFile(file);
    setScannedBarcodeData(null);
    setBarcodeScanError("");
    if (!file) return;

    try {
      setBarcodeScanning(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/verification/scan-barcode`, {
        method: "POST",
        body: formData,
      });

      const data: BarcodeScanResponse = await res.json();
      if (!res.ok) {
        setBarcodeScanError((data as any).detail || "Barcode scanning failed.");
        return;
      }

      setScannedBarcodeData(data);

      // Auto-select student if found in Vignan registry
      if (data.student && data.student.student_id) {
        setVerificationStudentId(data.student.student_id);
        setIsCustomStudentId(false);
      }
    } catch (err) {
      console.error("ID card barcode scan error:", err);
      setBarcodeScanError("Could not connect to barcode scanner API.");
    } finally {
      setBarcodeScanning(false);
    }
  };

  const verifyDocumentPhoto = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setAiVerificationResult(null);
    setVerifyError("");

    const sid = isCustomStudentId ? customStudentId.trim() : verificationStudentId.trim();

    if (!sid) {
      setVerifyError("Please select an enrolled student or enter a register number.");
      return;
    }

    if (!verificationDocumentType) {
      setVerifyError("Select the document type.");
      return;
    }

    if (!verificationFile) {
      setVerifyError(
        verificationDocumentType === "Student ID Proof"
          ? "Please upload the ID Card Front Photo."
          : "Upload a document photo."
      );
      return;
    }

    // MANDATORY ID Card Back Barcode Photo
    if (verificationDocumentType === "Student ID Proof" && !verificationBackFile) {
      setVerifyError(
        "Uploading ID card back photo with official barcode is mandatory for Student ID verification."
      );
      return;
    }

    try {
      setAiVerifying(true);

      const formData = new FormData();
      formData.append("student_id", sid);
      formData.append("document_type", verificationDocumentType);
      formData.append("file", verificationFile);
      if (verificationBackFile) {
        formData.append("back_file", verificationBackFile);
      }

      const response = await fetch(
        `${API_URL}/verification/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setVerifyError(
          data.detail || "AI verification failed."
        );
        return;
      }

      setAiVerificationResult(data);
      setVerificationFile(null);
      setVerificationBackFile(null);
      setScannedBarcodeData(null);

      await Promise.all([
        loadVerificationRequests(),
        loadReports(),
      ]);

    } catch (error) {
      console.error(error);
      setVerifyError("Backend or AI service connection failed.");
    } finally {
      setAiVerifying(false);
    }
  };



  const updateVerificationStatus = async (
    id: number,
    status: "Approved" | "Rejected" | "Manual Review"
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/verification/requests/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setVerifyError(
          data.detail || "Unable to update verification status."
        );
        return;
      }

      await loadVerificationRequests();
    } catch (error) {
      console.error(error);
      setVerifyError("Backend connection failed.");
    }
  };

  // =================================================
  // DISBURSEMENTS
  // =================================================

  const loadDisbursements = async () => {
    try {
      const response = await fetch(`${API_URL}/disbursements`);
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to load disbursements");
      setDisbursements(data);
    } catch (error) {
      console.error(error);
    }
  };


  const handleDisbursementChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;
    setDisbursementForm({ ...disbursementForm, [name]: value });
  };


  const addDisbursement = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setMessage("");

    if (
      !disbursementForm.student_id ||
      !disbursementForm.bank_name ||
      !disbursementForm.loan_amount
    ) {
      setMessage("Please fill student, bank name and loan amount.");
      return;
    }

    try {

      const response = await fetch(`${API_URL}/disbursements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: disbursementForm.student_id,
          bank_name: disbursementForm.bank_name,
          loan_amount: Number(disbursementForm.loan_amount),
          disbursed_date: disbursementForm.disbursed_date,
          notes: disbursementForm.notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Unable to record disbursement.");
        return;
      }

      setMessage("Disbursement recorded successfully.");

      setDisbursementForm({
        student_id: "",
        bank_name: "",
        loan_amount: "",
        disbursed_date: "",
        notes: ""
      });

      await loadDisbursements();
      await loadReports();

    } catch (error) {
      console.error(error);
      setMessage("Backend connection failed.");
    }
  };


  const reconcileDisbursement = async (disbursementId: number) => {

    try {

      const response = await fetch(
        `${API_URL}/disbursements/${disbursementId}/reconcile`,
        { method: "PATCH" }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Unable to reconcile.");
        return;
      }

      setMessage("Disbursement marked as reconciled.");

      await loadDisbursements();

    } catch (error) {
      console.error(error);
      setMessage("Backend connection failed.");
    }
  };


  // =================================================
  // REPORTS
  // =================================================

  const loadReports = async () => {
    try {

      const [summaryResponse, turnaroundResponse] = await Promise.all([
        fetch(`${API_URL}/reports/summary`),
        fetch(`${API_URL}/reports/turnaround`)
      ]);

      const summaryData = await summaryResponse.json();
      const turnaroundData = await turnaroundResponse.json();

      if (summaryResponse.ok) setReportSummary(summaryData);
      if (turnaroundResponse.ok) {
        if (Array.isArray(turnaroundData)) {
          setTurnaroundStats(turnaroundData);
        } else if (turnaroundData && Array.isArray(turnaroundData.by_document_type)) {
          setTurnaroundStats(turnaroundData.by_document_type);
        } else {
          setTurnaroundStats([]);
        }
      }

    } catch (error) {
      console.error(error);
    }
  };


  // DASHBOARD
  // =================================================

  const dashboard = (

    <>

      {/* AGENT 43 HERO ROW */}
      <div className="dashboard-hero-row">

        {/* LEFT: RADAR CARD */}
        <div className="hero-radar-card">
          <div>
            <div className="hero-tags">
              <span className="hero-tag-system">SYSTEM OPERATIONAL</span>
              <span className="hero-tag-live">● LIVE OCR & VERIFY ACTIVE</span>
            </div>

            <h2 className="hero-heading">
              Student Loan Support & AI Verification Radar
            </h2>

            <p className="hero-desc">
              Continuous real-time verification and multi-stage fraud detection across bonafide certificates, admission letters, fee estimates, and disbursement reconciliation for Vignan's Foundation for Science, Technology & Research.
            </p>
          </div>

          <div className="hero-actions-row">
            <div className="hero-chips">
              <span className="hero-chip">AI Engine: {aiStatus?.active_engine || "Built-in / Gemini"}</span>
              <span className="hero-chip">College Seal: VFSTR Stamp Valid</span>
              <span className="hero-chip">Mode: {aiStatus?.mode || "Hybrid Verification"}</span>
            </div>

            <button
              type="button"
              onClick={handleRefreshRadar}
              className="refresh-metrics-btn"
              disabled={refreshingRadar}
            >
              {refreshingRadar ? "Refreshing..." : "🔄 Refresh Metrics"}
            </button>
          </div>
        </div>

        {/* RIGHT: AI BOT CARD */}
        <div className="hero-bot-card">
          <div className="bot-card-header">
            <span className="bot-title">🤖 AI Loan Assistant · Q&A Bot</span>
            <button
              type="button"
              className="ask-robot-badge"
              onClick={() => handleAskBot("What is the status of loan requests?")}
            >
              Quick Scan ✨
            </button>
          </div>

          <div className="bot-interactive-area">
            <div className="bot-avatar-graphic">🤖</div>
            <div className="bot-speech-bubble">
              {botLoading ? (
                <span className="bot-typing">Agent 43 analyzing system data...</span>
              ) : (
                botResponse
              )}
            </div>
          </div>

          <div className="bot-input-bar">
            <input
              type="text"
              placeholder="Ask Agent 43 about loans, verification, or fees..."
              value={botInput}
              onChange={(e) => setBotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAskBot();
              }}
            />
            <button
              type="button"
              className="bot-send-btn"
              onClick={() => handleAskBot()}
            >
              Ask
            </button>
          </div>
        </div>

      </div>


      {/* 4 RADAR METRIC CARDS */}
      <div className="radar-stats-grid">

        <div className="radar-stat-card">
          <div className="stat-header">
            <span>TOTAL STUDENTS</span>
            <span className="stat-icon-badge blue">👥</span>
          </div>
          <div className="stat-number">{students.length}</div>
          <div className="stat-footer blue-text">● Active in VFSTR Student DB</div>
        </div>

        <div className="radar-stat-card">
          <div className="stat-header">
            <span>ACTIVE LOAN REQUESTS</span>
            <span className="stat-icon-badge amber">📋</span>
          </div>
          <div className="stat-number">
            {requests.filter((request) => request.status === "Pending").length}
          </div>
          <div className="stat-footer amber-text">● Awaiting Document Issue</div>
        </div>

        <div className="radar-stat-card">
          <div className="stat-header">
            <span>AI SCANS / VERIFICATIONS</span>
            <span className="stat-icon-badge red">🛡️</span>
          </div>
          <div className="stat-number">{verificationRequests.length}</div>
          <div className="stat-footer red-text">● Document Fraud & Stamp Scans</div>
        </div>

        <div className="radar-stat-card">
          <div className="stat-header">
            <span>APPROVED & DISBURSED</span>
            <span className="stat-icon-badge green">💰</span>
          </div>
          <div className="stat-number">
            ₹{disbursements.reduce((acc, d) => acc + (d.loan_amount || 0), 0).toLocaleString("en-IN")}
          </div>
          <div className="stat-footer green-text">● {disbursements.length} Disbursed Records</div>
        </div>

      </div>


      {/* RECENT REQUESTS TABLE */}
      <div className="section">

        <div className="section-header">
          <h2>Recent Document Requests</h2>
          <button
            type="button"
            className="primary-button"
            style={{ fontSize: "15px", padding: "10px 20px" }}
            onClick={() => setActivePage("Document Requests")}
          >
            + New Document Request
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="empty">
            No document requests yet. Create one from the Document Requests tab.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Document</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 5).map((request) => (
                  <tr key={request.id}>
                    <td><strong>{request.student_name}</strong> ({request.student_id})</td>
                    <td>{request.document_type}</td>
                    <td>{request.request_date}</td>
                    <td>
                      <span
                        className={
                          request.status === "Approved"
                            ? "status approved"
                            : "status pending"
                        }
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* QUICK SHORTCUTS */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: "14.5px", padding: "10px 18px" }}
            onClick={() => setActivePage("Verification")}
          >
            🛡️ AI Verification & Seal Checker
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: "14.5px", padding: "10px 18px" }}
            onClick={() => setActivePage("Students")}
          >
            👥 Student Database
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: "14.5px", padding: "10px 18px" }}
            onClick={() => setActivePage("Documents")}
          >
            📄 View Issued Documents & PDFs
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ fontSize: "14.5px", padding: "10px 18px" }}
            onClick={() => setActivePage("Disbursement")}
          >
            💰 Disbursement Ledger
          </button>
        </div>

      </div>

    </>

  );


  // =================================================
  // STUDENTS PAGE
  // =================================================

  const studentsPage = (

    <>

      <div className="page-title">

        <h1>Student Records</h1>

        <p>
          Add and manage student information
          required for education loan support.
        </p>

      </div>


      {message && (

        <div className="message">
          {message}
        </div>

      )}


      <div className="student-layout">


        <div className="section form-section">

          <h2>Add Student</h2>


          <form onSubmit={addStudent}>

            <div className="form-group">

              <label>Student Register Number</label>

              <input
                type="text"
                name="student_id"
                placeholder="Enter student register number"
                value={
                  studentForm.student_id
                }
                onChange={
                  handleStudentChange
                }
              />

            </div>


            <div className="form-group">

              <label>
                Student Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter student name"
                value={
                  studentForm.name
                }
                onChange={
                  handleStudentChange
                }
              />

            </div>


            <div className="form-group">

              <label>
                Course
              </label>

              <input
                type="text"
                name="course"
                placeholder="Example: B.Tech CSE"
                value={
                  studentForm.course
                }
                onChange={
                  handleStudentChange
                }
              />

            </div>


            <div className="form-group">

              <label>
                Year
              </label>

              <select
                name="year"
                value={
                  studentForm.year
                }
                onChange={
                  handleStudentChange
                }
              >

                <option value="">
                  Select year
                </option>

                <option value="1st Year">
                  1st Year
                </option>

                <option value="2nd Year">
                  2nd Year
                </option>

                <option value="3rd Year">
                  3rd Year
                </option>

                <option value="4th Year">
                  4th Year
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                Admission Year
              </label>

              <input
                type="text"
                name="admission_year"
                placeholder="Example: 2025"
                value={
                  studentForm.admission_year
                }
                onChange={
                  handleStudentChange
                }
              />

            </div>


            <div className="form-group">

              <label>
                Total Course Fee (₹)
              </label>

              <input
                type="number"
                name="total_fee"
                placeholder="Example: 400000"
                value={
                  studentForm.total_fee
                }
                onChange={
                  handleStudentChange
                }
              />

            </div>


            <button
              type="submit"
              className="primary-button"
            >
              Add Student
            </button>

          </form>

        </div>


        <div className="section student-list">

          <div className="section-header">

            <h2>
              All Students
            </h2>

            <button
              className="secondary-button"
              onClick={loadStudents}
            >
              Refresh
            </button>

          </div>


          {students.length === 0 ? (

            <p className="empty">
              No student records available.
            </p>

          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Admission</th>
                    <th>Fee</th>
                    <th>Action</th>

                  </tr>

                </thead>


                <tbody>

                  {students.map(
                    (student) => (

                      <tr key={student.id}>

                        <td>
                          {student.student_id}
                        </td>

                        <td>
                          {student.name}
                        </td>

                        <td>
                          {student.course}
                        </td>

                        <td>
                          {student.year}
                        </td>

                        <td>
                          {student.admission_year}
                        </td>

                        <td>
                          ₹{(Number(student.total_fee) || 0).toLocaleString("en-IN")}
                        </td>

                        <td>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteStudent(
                                student.student_id
                              )
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </>

  );


  // =================================================
  // DOCUMENT REQUEST PAGE
  // =================================================

  const documentRequestsPage = (

    <>

      <div className="page-title">

        <h1>
          Document Requests
        </h1>

        <p>
          Create and manage institutional
          documents required for education loans.
        </p>

      </div>


      {message && (

        <div className="message">
          {message}
        </div>

      )}


      <div className="student-layout">


        {/* CREATE REQUEST */}

        <div className="section form-section">

          <h2>
            Create Request
          </h2>


          <form onSubmit={createRequest}>

            <div className="form-group">

              <label>
                Select Student
              </label>

              <select
                name="student_id"
                value={
                  requestForm.student_id
                }
                onChange={
                  handleRequestChange
                }
              >

                <option value="">
                  Select student
                </option>

                {students.map(
                  (student) => (

                    <option
                      key={student.id}
                      value={
                        student.student_id
                      }
                    >
                      {student.student_id}
                      {" - "}
                      {student.name}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="form-group">

              <label>
                Document Type
              </label>

              <select
                name="document_type"
                value={
                  requestForm.document_type
                }
                onChange={
                  handleRequestChange
                }
              >

                <option value="">
                  Select document
                </option>

                <option value="Bonafide Certificate">
                  Bonafide Certificate
                </option>

                <option value="Fee Structure">
                  Fee Structure
                </option>

                <option value="Admission Confirmation">
                  Admission Confirmation
                </option>

                <option value="Study Certificate">
                  Study Certificate
                </option>

                <option value="Fee Receipt">
                  Fee Receipt
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                Description
              </label>

              <textarea
                name="description"
                placeholder="Enter additional details"
                value={
                  requestForm.description
                }
                onChange={
                  handleRequestChange
                }
                rows={4}
              />

            </div>


            <button
              type="submit"
              className="primary-button"
            >
              Create Request
            </button>

          </form>

        </div>


        {/* REQUEST LIST */}

        <div className="section student-list">

          <div className="section-header">

            <h2>
              All Requests
            </h2>

            <button
              className="secondary-button"
              onClick={loadRequests}
            >
              Refresh
            </button>

          </div>


          {loading ? (

            <p>
              Loading requests...
            </p>

          ) : requests.length === 0 ? (

            <p className="empty">
              No document requests available.
            </p>

          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>Student</th>
                    <th>Document</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>

                  </tr>

                </thead>


                <tbody>

                  {requests.map(
                    (request) => (

                      <tr key={request.id}>

                        <td>

                          <strong>
                            {request.student_name}
                          </strong>

                          <br />

                          <small>
                            {request.student_id}
                          </small>

                        </td>


                        <td>
                          {request.document_type}
                        </td>


                        <td>
                          {request.request_date}
                        </td>


                        <td>

                          <span
                            className={
                              request.status ===
                              "Approved"
                                ? "status approved"
                                : request.status ===
                                  "Rejected"
                                ? "status rejected"
                                : "status pending"
                            }
                          >
                            {request.status}
                          </span>

                        </td>


                        <td>

                          {request.status ===
                          "Pending" ? (

                            <div className="action-buttons">

                              <button
                                className="approve-button"
                                onClick={() =>
                                  updateRequestStatus(
                                    request.id,
                                    "Approved"
                                  )
                                }
                              >
                                Approve
                              </button>


                              <button
                                className="reject-button"
                                onClick={() =>
                                  updateRequestStatus(
                                    request.id,
                                    "Rejected"
                                  )
                                }
                              >
                                Reject
                              </button>

                            </div>

                          ) : (

                            <span>
                              Completed
                            </span>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </>

  );


  // =================================================
  // DOCUMENTS PAGE
  // =================================================

  const documentsPage = (

    <>

      <div className="page-title">
        <h1>Documents</h1>
        <p>
          Generate institutional certificates and letters from
          live student records.
        </p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="section">

        <div className="section-header">
          <h2>Requests Awaiting Document Generation</h2>
          <button className="secondary-button" onClick={loadRequests}>
            Refresh
          </button>
        </div>

        {(() => {

          const generatedRequestIds = new Set(
            documents.map((d) => d.request_id)
          );

          const pendingForGeneration = requests.filter(
            (r) => !generatedRequestIds.has(r.id)
          );

          return pendingForGeneration.length === 0 ? (
            <p className="empty">
              No requests are waiting on a document right now.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Document</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingForGeneration.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.student_name}</strong>
                        <br />
                        <small>{r.student_id}</small>
                      </td>
                      <td>{r.document_type}</td>
                      <td>{r.request_date}</td>
                      <td>
                        <span
                          className={
                            r.status === "Approved"
                              ? "status approved"
                              : r.status === "Rejected"
                              ? "status rejected"
                              : "status pending"
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="approve-button"
                          onClick={() => generateDocument(r.id)}
                        >
                          Generate Document
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

      </div>

      <div className="section">

        <div className="section-header">
          <h2>Issued Documents</h2>
          <button className="secondary-button" onClick={loadDocuments}>
            Refresh
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="empty">No documents generated yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Document</th>
                  <th>Verification Code</th>
                  <th>Issued</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.student_name}</strong>
                      <br />
                      <small>{d.student_id}</small>
                    </td>
                    <td>{d.document_type}</td>
                    <td>
                      <code>{d.verification_code}</code>
                    </td>
                    <td>{d.issued_date}</td>
                    <td>
                      <button
                        className="secondary-button"
                        onClick={() => downloadDocument(d.id)}
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </>

  );


  // =================================================
  // AI VERIFICATION PAGE
  // =================================================

  const verificationPage = (

    <>
      <div className="page-title">
        <h1>AI Document Verification</h1>
        <p>
          Upload a document photo. The AI verification agent screens
          it for authenticity and sends the request to Approved,
          Rejected, or Manual Review.
        </p>
      </div>

      {/* AI STATUS BANNER */}
      <div className="ai-status-banner">
        <div className="ai-status-indicator">
          <span className={`ai-badge ${aiStatus?.has_api_key ? "live" : "builtin"}`}>
            {aiStatus?.has_api_key ? "● Live Google Gemini Vision" : "● Built-in Intelligent Engine (Ready)"}
          </span>
          <span style={{ fontSize: "15px", color: "#334155", fontWeight: 500 }}>
            {aiStatus?.has_api_key
              ? `Model: ${aiStatus.model} | Key: ${aiStatus.masked_key}`
              : "Active & Ready (Works out of the box with or without Gemini API key)"}
          </span>
        </div>

        <button
          type="button"
          className="secondary-button"
          style={{ fontSize: "15px", padding: "10px 18px" }}
          onClick={() => setShowAiSettings(!showAiSettings)}
        >
          {showAiSettings ? "Hide Settings" : "⚙ AI Engine & Key Settings"}
        </button>
      </div>

      {/* AI SETTINGS CARD */}
      {showAiSettings && (
        <div className="ai-settings-card">
          <h3>Google Gemini AI Configuration</h3>
          <p>
            You can optionally configure a Google Gemini API key to enable live vision multimodal inspection.
            If no key is configured or Google API is offline, the system automatically uses the Built-in Verification Engine without interrupting your workflow.
          </p>

          <form onSubmit={handleSaveAiConfig} className="ai-settings-form">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Gemini API Key</label>
              <input
                type="password"
                placeholder={aiStatus?.has_api_key ? "API Key is currently active (enter new key to update)" : "Paste AIzaSy... API key here"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <small style={{ fontSize: "13.5px", marginTop: "4px", display: "block" }}>
                Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>Google AI Studio</a>.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Gemini Model</label>
              <select
                value={apiModelInput}
                onChange={(e) => setApiModelInput(e.target.value)}
              >
                <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Free Tier Recommended)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Latest Flash Model)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "8px" }}>
              <button
                type="submit"
                className="primary-button"
                disabled={testingKey}
                style={{ padding: "10px 22px", fontSize: "15px" }}
              >
                {testingKey ? "Saving & Testing..." : "Save Configuration"}
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={testingKey}
                onClick={handleTestAiKey}
                style={{ padding: "10px 22px", fontSize: "15px" }}
              >
                Test Key Connection
              </button>

              {aiStatus?.has_api_key && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={testingKey}
                  onClick={async () => {
                    setApiKeyInput("");
                    const res = await fetch(`${API_URL}/ai/config`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ gemini_api_key: "", gemini_model: "gemini-1.5-flash" })
                    });
                    const d = await res.json();
                    setAiStatus(d);
                    setKeyFeedback("Reset to Built-in Engine.");
                  }}
                  style={{ padding: "10px 22px", fontSize: "15px", color: "#b91c1c" }}
                >
                  Reset to Built-in Engine
                </button>
              )}
            </div>

            {keyFeedback && (
              <div style={{
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                background: keyFeedback.includes("✓") ? "#f0fdf4" : "#fefce8",
                color: keyFeedback.includes("✓") ? "#166534" : "#854d0e",
                border: keyFeedback.includes("✓") ? "1px solid #bbf7d0" : "1px solid #fef08a"
              }}>
                {keyFeedback}
              </div>
            )}
          </form>
        </div>
      )}

      {verifyError && (
        <div className="message verification-error">
          {verifyError}
        </div>
      )}


      <div className="student-layout">

        <div className="section form-section">

          <h2>Upload Document</h2>

          <form onSubmit={verifyDocumentPhoto}>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ margin: 0 }}>Student Register Number</label>
                <label style={{ fontSize: "13.5px", color: "#2563eb", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isCustomStudentId}
                    onChange={(e) => setIsCustomStudentId(e.target.checked)}
                  />
                  Manual Entry / External ID
                </label>
              </div>

              {!isCustomStudentId ? (
                <select
                  value={verificationStudentId}
                  onChange={(e) =>
                    setVerificationStudentId(e.target.value)
                  }
                >
                  <option value="">Select registered student</option>
                  {students.map((student) => (
                    <option
                      key={student.student_id}
                      value={student.student_id}
                    >
                      {student.name} ({student.student_id}) — {student.course}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter student register number"
                  value={customStudentId}
                  onChange={(e) => setCustomStudentId(e.target.value)}
                />
              )}
            </div>

            <div className="form-group">
              <label>Document Type</label>
              <select
                value={verificationDocumentType}
                onChange={(e) =>
                  setVerificationDocumentType(e.target.value)
                }
              >
                <option value="">Select document</option>
                <option>Bonafide Certificate</option>
                <option>Fee Structure</option>
                <option>Admission Confirmation</option>
                <option>Study Certificate</option>
                <option>Fee Receipt</option>
                <option>Student ID Proof</option>
              </select>
            </div>

            {verificationDocumentType === "Student ID Proof" ? (
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1.5px dashed #94a3b8", marginBottom: "16px" }}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", marginBottom: "6px" }}>
                    🪪 ID Card Front Photo (Student Photo, Name, Regd No) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      setVerificationFile(
                        e.target.files?.[0] || null
                      )
                    }
                  />
                  {verificationFile && (
                    <div className="upload-preview" style={{ marginTop: "6px" }}>
                      <strong>Front Selected:</strong> {verificationFile.name}
                    </div>
                  )}
                  <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                    Upload clear front photo of Vignan ID card.
                  </small>
                </div>

                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                  <label style={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "15px", marginBottom: "6px" }}>
                    <span>📊 ID Card Back Photo (Official Barcode)</span>
                    <span style={{ color: "#ef4444", fontSize: "12px", background: "#fef2f2", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: "9999px", fontWeight: 800 }}>
                      * MANDATORY
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleBackFileChange(
                        e.target.files?.[0] || null
                      )
                    }
                  />

                  {/* Scanning indicator */}
                  {barcodeScanning && (
                    <div style={{ marginTop: "10px", padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", color: "#1e40af" }}>
                      <span className="spinner" style={{ width: "18px", height: "18px", border: "2px solid #93c5fd", borderTopColor: "#1d4ed8", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: "13.5px", fontWeight: 600 }}>Scanning ID Card Barcode &amp; querying Vignan database...</span>
                    </div>
                  )}

                  {/* Error indicator */}
                  {barcodeScanError && (
                    <div style={{ marginTop: "10px", padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "13px" }}>
                      ⚠️ {barcodeScanError}
                    </div>
                  )}

                  {/* Real-time Decoded Barcode & Student Details Box */}
                  {scannedBarcodeData && !barcodeScanning && (
                    <div style={{ marginTop: "12px" }}>
                      {scannedBarcodeData.student ? (
                        <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", border: "1.5px solid #86efac", borderRadius: "10px", padding: "14px 16px", boxShadow: "0 2px 6px rgba(16, 185, 129, 0.08)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid #bbf7d0", paddingBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "18px" }}>🎖️</span>
                              <strong style={{ color: "#15803d", fontSize: "14.5px" }}>Official Vignan Barcode Verified</strong>
                            </div>
                            <span style={{ background: "#dcfce7", color: "#166534", fontSize: "12px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                              ✓ 100% REGISTRY MATCH
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px", fontSize: "13px" }}>
                            <div>
                              <span style={{ color: "#4b5563", fontSize: "12px", display: "block" }}>Decoded Barcode:</span>
                              <code style={{ background: "#dcfce7", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, color: "#166534", fontSize: "13px" }}>
                                {scannedBarcodeData.barcode}
                              </code>
                            </div>

                            <div>
                              <span style={{ color: "#4b5563", fontSize: "12px", display: "block" }}>Student Name:</span>
                              <strong style={{ color: "#111827", fontSize: "13.5px" }}>{scannedBarcodeData.student.name}</strong>
                            </div>

                            <div>
                              <span style={{ color: "#4b5563", fontSize: "12px", display: "block" }}>Register Number:</span>
                              <strong style={{ color: "#111827" }}>{scannedBarcodeData.student.student_id}</strong>
                            </div>

                            <div>
                              <span style={{ color: "#4b5563", fontSize: "12px", display: "block" }}>Program / Branch:</span>
                              <span style={{ color: "#1f2937", fontWeight: 600 }}>{scannedBarcodeData.student.course}</span>
                            </div>

                            <div>
                              <span style={{ color: "#4b5563", fontSize: "12px", display: "block" }}>Year / Batch:</span>
                              <span style={{ color: "#1f2937" }}>{scannedBarcodeData.student.year} (Admitted {scannedBarcodeData.student.admission_year})</span>
                            </div>

                            <div>
                              <span style={{ color: "#4b5563", fontSize: "12px", display: "block" }}>College Fee:</span>
                              <strong style={{ color: "#047857" }}>₹ {(Number(scannedBarcodeData.student?.total_fee) || 0).toLocaleString("en-IN")}</strong>
                            </div>
                          </div>

                          <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #bbf7d0", fontSize: "12px", color: "#15803d", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>✓</span> Student automatically matched and selected in verification form.
                          </div>
                        </div>
                      ) : scannedBarcodeData.barcode ? (
                        <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: "10px", padding: "12px 14px", color: "#92400e" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "16px" }}>⚠️</span>
                            <strong style={{ fontSize: "14px" }}>Barcode Decoded: {scannedBarcodeData.barcode}</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: "12.5px" }}>
                            Barcode was decoded, but register number <strong>{scannedBarcodeData.barcode}</strong> was not found in Vignan student records.
                          </p>
                        </div>
                      ) : (
                        <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "10px", padding: "12px 14px", color: "#991b1b" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "16px" }}>✗</span>
                            <strong style={{ fontSize: "14px" }}>No Barcode Detected</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: "12.5px" }}>
                            No clear barcode found on this image. Please upload a clear photo of the ID card back with the barcode visible.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!verificationBackFile && (
                    <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                      Upload back side of ID card with barcode. The barcode will be automatically scanned and student details displayed.
                    </small>
                  )}
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Document Photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setVerificationFile(
                      e.target.files?.[0] || null
                    )
                  }
                />
                <small>
                  Upload a clear JPG, PNG or WEBP photo (max 10 MB).
                </small>
                {verificationFile && (
                  <div className="upload-preview" style={{ marginTop: "6px" }}>
                    <strong>Selected:</strong> {verificationFile.name}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={aiVerifying}
            >
              {aiVerifying
                ? "Verifying Document..."
                : "Verify Document Authenticity"}
            </button>

          </form>

        </div>

        <div className="section">

          <h2>AI Authenticity Scorecard</h2>

          {!aiVerificationResult ? (
            <p className="empty">
              Upload a document photo to verify and generate the official Authenticity Scorecard.
            </p>
          ) : (
            <div
              className={`scorecard-container ${
                aiVerificationResult.ai_verdict === "VERIFIED" || aiVerificationResult.ai_verdict === "REAL"
                  ? "verified"
                  : aiVerificationResult.ai_verdict === "REJECTED" || aiVerificationResult.ai_verdict === "FAKE"
                  ? "rejected"
                  : "review"
              }`}
            >
              {/* Scorecard Header */}
              <div className="scorecard-header">
                <div className="scorecard-header-left">
                  <div className="scorecard-crest-icon">🏛️</div>
                  <div>
                    <h3 className="scorecard-title">VIGNAN DOCUMENT VERIFICATION</h3>
                    <div className="scorecard-subtitle">
                      Vignan's Foundation for Science, Technology &amp; Research (VFSTR)
                    </div>
                  </div>
                </div>
              </div>

              {/* Scorecard Body */}
              <div className="scorecard-body">
                {/* Verified Barcode & Student Details Widget */}
                {aiVerificationResult.barcode_info && aiVerificationResult.barcode_info.detected && (
                  <div style={{
                    marginBottom: "16px",
                    background: aiVerificationResult.barcode_info.matched ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)" : "#fef2f2",
                    border: `1.5px solid ${aiVerificationResult.barcode_info.matched ? "#86efac" : "#fecaca"}`,
                    borderRadius: "10px",
                    padding: "14px 16px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, color: aiVerificationResult.barcode_info.matched ? "#15803d" : "#991b1b", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        📊 Verified Barcode: <code>{aiVerificationResult.barcode_info.code}</code>
                      </span>
                      <span style={{
                        background: aiVerificationResult.barcode_info.matched ? "#dcfce7" : "#fee2e2",
                        color: aiVerificationResult.barcode_info.matched ? "#166534" : "#b91c1c",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px"
                      }}>
                        {aiVerificationResult.barcode_info.matched ? "✓ OFFICIAL BARCODE MATCHED" : "✗ BARCODE MISMATCH"}
                      </span>
                    </div>

                    {aiVerificationResult.barcode_info.student && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", fontSize: "12.5px", color: "#1f2937", borderTop: "1px solid #d1fae5", paddingTop: "8px" }}>
                        <div><strong>Student:</strong> {aiVerificationResult.barcode_info.student.name}</div>
                        <div><strong>Register No:</strong> {aiVerificationResult.barcode_info.student.student_id}</div>
                        <div><strong>Program:</strong> {aiVerificationResult.barcode_info.student.course}</div>
                        <div><strong>Year:</strong> {aiVerificationResult.barcode_info.student.year} (Batch: {aiVerificationResult.barcode_info.student.admission_year})</div>
                        <div><strong>Fee:</strong> ₹ {(Number(aiVerificationResult.barcode_info?.student?.total_fee) || 0).toLocaleString("en-IN")}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* 9 Scorecard Rows */}
                <table className="scorecard-table">

                  <tbody>
                    {(aiVerificationResult.scorecard && aiVerificationResult.scorecard.length > 0
                      ? aiVerificationResult.scorecard
                      : [
                          {
                            label: "Institution Name",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ MATCH" : "✗ UNVERIFIED",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "Student Register No",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ MATCH" : "✗ NOT FOUND",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "Student Name",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ MATCH" : "✗ NOT FOUND",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "Program/Branch",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ MATCH" : "✗ NOT FOUND",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "Document Number",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ VALID" : "✗ INVALID",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "QR / Barcode",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ VALID" : "✗ INVALID",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "University Seal",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ DETECTED" : "✗ NOT DETECTED",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "Template/Layout",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ MATCH" : "✗ IRREGULAR",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          },
                          {
                            label: "Tampering Indicators",
                            value: aiVerificationResult.ai_verdict === "VERIFIED" ? "✓ NOT DETECTED" : "⚠ DETECTED",
                            status: aiVerificationResult.ai_verdict === "VERIFIED" ? "pass" : "fail"
                          }
                        ]
                    ).map((item, idx) => (
                      <tr key={idx} className="scorecard-row">
                        <td className="scorecard-cell-label">{item.label}</td>
                        <td className="scorecard-cell-value">
                          <span
                            className={`scorecard-badge ${
                              item.status === "pass" ? "pass" : item.status === "warn" ? "warn" : "fail"
                            }`}
                          >
                            {item.value}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="scorecard-divider" />

                {/* Scorecard Decision Banner */}
                <div
                  className={`scorecard-decision-banner ${
                    aiVerificationResult.ai_verdict === "VERIFIED" || aiVerificationResult.ai_verdict === "REAL"
                      ? "verified"
                      : aiVerificationResult.ai_verdict === "REJECTED" || aiVerificationResult.ai_verdict === "FAKE"
                      ? "rejected"
                      : "review"
                  }`}
                >
                  <div className="scorecard-final-verdict">
                    <span className="final-tag">FINAL VERIFICATION RESULT</span>
                    <span className="final-status-text">
                      {aiVerificationResult.ai_verdict === "VERIFIED" || aiVerificationResult.ai_verdict === "REAL"
                        ? "FINAL: VERIFIED"
                        : aiVerificationResult.ai_verdict === "REJECTED" || aiVerificationResult.ai_verdict === "FAKE"
                        ? "FINAL: REJECTED"
                        : "FINAL: REVIEW"}
                    </span>
                    {(aiVerificationResult.ai_verdict === "REJECTED" ||
                      aiVerificationResult.ai_verdict === "FAKE" ||
                      aiVerificationResult.ai_verdict === "REVIEW" ||
                      aiVerificationResult.reason) && (
                      <div className="scorecard-reason-text">
                        <strong>REASON:</strong> {aiVerificationResult.reason}
                      </div>
                    )}
                  </div>

                  <div className="scorecard-metrics">
                    <span className="confidence-chip">
                      CONFIDENCE: {Number(aiVerificationResult.confidence).toFixed(0)}%
                    </span>
                    <span
                      className={`status ${
                        aiVerificationResult.status === "Approved"
                          ? "approved"
                          : aiVerificationResult.status === "Rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {aiVerificationResult.status}
                    </span>
                  </div>
                </div>

                {/* Scorecard Action Buttons */}
                <div className="scorecard-actions-bar">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowRawScorecard(!showRawScorecard)}
                    style={{ fontSize: "14.5px", padding: "8px 18px" }}
                  >
                    {showRawScorecard ? "Hide ASCII View" : "📄 View Raw ASCII Scorecard"}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      copyScorecardToClipboard(
                        aiVerificationResult.scorecard_text ||
                          `VIGNAN DOCUMENT VERIFICATION\n──────────────────────────────\nFINAL: ${aiVerificationResult.ai_verdict}\nCONFIDENCE: ${Number(aiVerificationResult.confidence).toFixed(0)}%`
                      )
                    }
                    style={{ fontSize: "14.5px", padding: "8px 18px" }}
                  >
                    {copiedScorecard ? "✓ Copied Scorecard!" : "📋 Copy Scorecard Text"}
                  </button>
                </div>

                {/* Monospace Raw Scorecard Box */}
                {showRawScorecard && (
                  <pre className="ascii-scorecard-box">
                    {aiVerificationResult.scorecard_text ||
                      "VIGNAN DOCUMENT VERIFICATION\n──────────────────────────────\nGenerating scorecard text..."}
                  </pre>
                )}

                <p className="ai-disclaimer">
                  Autonomous Verification Rule: Certificate verification requires matching student and document details against
                  official VFSTR registries. Documents are subject to factual verification against originals.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      <div className="section">

        <div className="section-header">
          <h2>Verification Requests</h2>

          <button
            className="secondary-button"
            onClick={loadVerificationRequests}
          >
            Refresh
          </button>
        </div>

        {verificationRequests.length === 0 ? (
          <p className="empty">
            No uploaded verification requests yet.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Document</th>
                  <th>AI Result</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {verificationRequests.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.student_name}</strong>
                      <br />
                      <small>{item.student_id}</small>
                    </td>

                    <td>
                      {item.document_type}
                      <br />
                      <small>{item.filename}</small>
                    </td>

                    <td>
                      <span
                        className={
                          item.ai_verdict === "VERIFIED" || item.ai_verdict === "REAL"
                            ? "status approved"
                            : item.ai_verdict === "REJECTED" || item.ai_verdict === "FAKE"
                            ? "status rejected"
                            : "status pending"
                        }
                      >
                        {item.ai_verdict}
                      </span>
                      {item.ai_engine && (
                        <>
                          <br />
                          <small style={{ color: "#475569", fontSize: "13.5px", fontWeight: 600 }}>
                            {item.ai_engine}
                          </small>
                        </>
                      )}
                    </td>

                    <td>
                      {Number(item.confidence).toFixed(1)}%
                    </td>

                    <td>
                      <span
                        className={
                          item.status === "Approved"
                            ? "status approved"
                            : item.status === "Rejected"
                            ? "status rejected"
                            : "status pending"
                        }
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {item.scorecard && item.scorecard.length > 0 && (
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ fontSize: "13px", padding: "4px 10px", width: "fit-content" }}
                            onClick={() => setSelectedScorecardModal(item)}
                          >
                            📊 View Scorecard
                          </button>
                        )}
                        {item.status === "Manual Review" ? (
                          <div className="action-buttons">
                            <button
                              className="approve-button"
                              onClick={() =>
                                updateVerificationStatus(
                                  item.id,
                                  "Approved"
                                )
                              }
                            >
                              Approve
                            </button>

                            <button
                              className="reject-button"
                              onClick={() =>
                                updateVerificationStatus(
                                  item.id,
                                  "Rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <small style={{ color: "#64748b" }}>{item.reason}</small>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* SCORECARD MODAL PREVIEW */}
      {selectedScorecardModal && (
        <div className="modal-overlay" onClick={() => setSelectedScorecardModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="scorecard-container" style={{ margin: 0, border: "none" }}>
              <div className="scorecard-header">
                <div className="scorecard-header-left">
                  <div className="scorecard-crest-icon">🏛️</div>
                  <div>
                    <h3 className="scorecard-title">VIGNAN DOCUMENT VERIFICATION</h3>
                    <div className="scorecard-subtitle">
                      Record #{selectedScorecardModal.id} — {selectedScorecardModal.student_name} ({selectedScorecardModal.student_id})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedScorecardModal(null)}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "white",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "14px"
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div className="scorecard-body">
                {/* Modal Barcode Info if available */}
                {selectedScorecardModal.barcode_info && selectedScorecardModal.barcode_info.detected && (
                  <div style={{
                    marginBottom: "16px",
                    background: selectedScorecardModal.barcode_info.matched ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)" : "#fef2f2",
                    border: `1.5px solid ${selectedScorecardModal.barcode_info.matched ? "#86efac" : "#fecaca"}`,
                    borderRadius: "10px",
                    padding: "14px 16px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, color: selectedScorecardModal.barcode_info.matched ? "#15803d" : "#991b1b", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        📊 Verified Barcode: <code>{selectedScorecardModal.barcode_info.code}</code>
                      </span>
                      <span style={{
                        background: selectedScorecardModal.barcode_info.matched ? "#dcfce7" : "#fee2e2",
                        color: selectedScorecardModal.barcode_info.matched ? "#166534" : "#b91c1c",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px"
                      }}>
                        {selectedScorecardModal.barcode_info.matched ? "✓ OFFICIAL BARCODE MATCHED" : "✗ BARCODE MISMATCH"}
                      </span>
                    </div>

                    {selectedScorecardModal.barcode_info.student && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", fontSize: "12.5px", color: "#1f2937", borderTop: "1px solid #d1fae5", paddingTop: "8px" }}>
                        <div><strong>Student:</strong> {selectedScorecardModal.barcode_info.student.name}</div>
                        <div><strong>Register No:</strong> {selectedScorecardModal.barcode_info.student.student_id}</div>
                        <div><strong>Program:</strong> {selectedScorecardModal.barcode_info.student.course}</div>
                        <div><strong>Year:</strong> {selectedScorecardModal.barcode_info.student.year} (Batch: {selectedScorecardModal.barcode_info.student.admission_year})</div>
                        <div><strong>Fee:</strong> ₹ {(Number(selectedScorecardModal.barcode_info?.student?.total_fee) || 0).toLocaleString("en-IN")}</div>
                      </div>
                    )}
                  </div>
                )}

                <table className="scorecard-table">

                  <tbody>
                    {(selectedScorecardModal.scorecard || []).map((row, idx) => (
                      <tr key={idx} className="scorecard-row">
                        <td className="scorecard-cell-label">{row.label}</td>
                        <td className="scorecard-cell-value">
                          <span
                            className={`scorecard-badge ${
                              row.status === "pass" ? "pass" : row.status === "warn" ? "warn" : "fail"
                            }`}
                          >
                            {row.value}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  className={`scorecard-decision-banner ${
                    selectedScorecardModal.ai_verdict === "VERIFIED" || selectedScorecardModal.ai_verdict === "REAL"
                      ? "verified"
                      : selectedScorecardModal.ai_verdict === "REJECTED" || selectedScorecardModal.ai_verdict === "FAKE"
                      ? "rejected"
                      : "review"
                  }`}
                >
                  <div className="scorecard-final-verdict">
                    <span className="final-tag">FINAL VERIFICATION RESULT</span>
                    <span className="final-status-text">
                      FINAL: {selectedScorecardModal.ai_verdict}
                    </span>
                    <div className="scorecard-reason-text">
                      <strong>REASON:</strong> {selectedScorecardModal.reason}
                    </div>
                  </div>

                  <div className="scorecard-metrics">
                    <span className="confidence-chip">
                      CONFIDENCE: {Number(selectedScorecardModal.confidence).toFixed(0)}%
                    </span>
                    <span
                      className={`status ${
                        selectedScorecardModal.status === "Approved"
                          ? "approved"
                          : selectedScorecardModal.status === "Rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {selectedScorecardModal.status}
                    </span>
                  </div>
                </div>

                {selectedScorecardModal.scorecard_text && (
                  <pre className="ascii-scorecard-box">
                    {selectedScorecardModal.scorecard_text}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>

  );


  // =================================================
  // DISBURSEMENT PAGE
  // =================================================

  const disbursementPage = (

    <>

      <div className="page-title">
        <h1>Disbursement</h1>
        <p>
          Track loan amounts the bank pays directly to the
          institution and reconcile them against the fee ledger.
        </p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="student-layout">

        <div className="section form-section">

          <h2>Record Disbursement</h2>

          <form onSubmit={addDisbursement}>

            <div className="form-group">
              <label>Student</label>
              <select
                name="student_id"
                value={disbursementForm.student_id}
                onChange={handleDisbursementChange}
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name} ({s.student_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                name="bank_name"
                placeholder="Example: State Bank of India"
                value={disbursementForm.bank_name}
                onChange={handleDisbursementChange}
              />
            </div>

            <div className="form-group">
              <label>Loan Amount (₹)</label>
              <input
                type="number"
                name="loan_amount"
                placeholder="Example: 200000"
                value={disbursementForm.loan_amount}
                onChange={handleDisbursementChange}
              />
            </div>

            <div className="form-group">
              <label>Disbursed Date</label>
              <input
                type="date"
                name="disbursed_date"
                value={disbursementForm.disbursed_date}
                onChange={handleDisbursementChange}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                placeholder="Optional notes"
                value={disbursementForm.notes}
                onChange={handleDisbursementChange}
                rows={3}
              />
            </div>

            <button type="submit" className="primary-button">
              Record Disbursement
            </button>

          </form>

        </div>

        <div className="section student-list">

          <div className="section-header">
            <h2>All Disbursements</h2>
            <button
              className="secondary-button"
              onClick={loadDisbursements}
            >
              Refresh
            </button>
          </div>

          {disbursements.length === 0 ? (
            <p className="empty">No disbursements recorded yet.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Bank</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Fee Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursements.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.student_name}</strong>
                        <br />
                        <small>{d.student_id}</small>
                      </td>
                      <td>{d.bank_name}</td>
                      <td>₹{(Number(d.loan_amount) || 0).toLocaleString("en-IN")}</td>
                      <td>{d.disbursed_date}</td>
                      <td>
                        <span
                          className={
                            d.fee_status === "Fully Reconciled"
                              ? "status approved"
                              : d.fee_status === "Not Reconciled"
                              ? "status rejected"
                              : "status pending"
                          }
                        >
                          {d.fee_status}
                        </span>
                      </td>
                      <td>
                        {d.reconciled ? (
                          <span>Confirmed</span>
                        ) : (
                          <button
                            className="approve-button"
                            onClick={() => reconcileDisbursement(d.id)}
                          >
                            Mark Reconciled
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </>

  );


  // =================================================
  // REPORTS PAGE
  // =================================================

  const reportsPage = (

    <>

      <div className="page-title">
        <h1>Reports</h1>
        <p>
          Turnaround times and overall processing volumes, since
          delay here has a direct financial cost to families.
        </p>
      </div>

      <div className="section-header">
        <h2></h2>
        <button className="secondary-button" onClick={loadReports}>
          Refresh
        </button>
      </div>

      <div className="cards">

        <div className="card">
          <div className="card-icon">🎓</div>
          <h3>Total Students</h3>
          <strong>{reportSummary?.total_students ?? 0}</strong>
        </div>

        <div className="card">
          <div className="card-icon">📋</div>
          <h3>Total Requests</h3>
          <strong>{reportSummary?.total_requests ?? 0}</strong>
        </div>

        <div className="card">
          <div className="card-icon">⏳</div>
          <h3>Pending Requests</h3>
          <strong>{reportSummary?.pending_requests ?? 0}</strong>
        </div>

        <div className="card">
          <div className="card-icon">📄</div>
          <h3>Documents Issued</h3>
          <strong>{reportSummary?.documents_issued ?? 0}</strong>
        </div>

        <div className="card">
          <div className="card-icon">💰</div>
          <h3>Total Disbursed</h3>
          <strong>
            ₹{(reportSummary?.total_disbursed ?? 0).toLocaleString("en-IN")}
          </strong>
        </div>

      </div>

      <div className="section">

        <h2>Average Turnaround Time by Document Type</h2>

        {(!Array.isArray(turnaroundStats) || turnaroundStats.length === 0) ? (
          <p className="empty">
            No issued documents yet to calculate turnaround time.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Documents Issued</th>
                  <th>Average Turnaround</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(turnaroundStats) ? turnaroundStats : []).map((stat) => (
                  <tr key={stat.document_type}>
                    <td>{stat.document_type}</td>
                    <td>{stat.count}</td>
                    <td>{stat.average_days ?? (stat.average_hours ? Math.round((stat.average_hours / 24) * 10) / 10 : 0)} day(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </>

  );


  // =================================================
  // PLACEHOLDER
  // =================================================

  const placeholderPage = (

    <>

      <div className="page-title">

        <h1>
          {activePage}
        </h1>

        <p>
          This module will be developed
          in the next step.
        </p>

      </div>


      <div className="section">

        <div className="coming-soon">

          <div>🚧</div>

          <h2>
            {activePage}
          </h2>

          <p>
            This feature is coming soon.
          </p>

        </div>

      </div>

    </>

  );


  // =================================================
  // MAIN UI
  // =================================================

  return (
    <div className="portal-container">

      {/* TOPBAR: VIGNAN LOGO, AGENT 43 TITLE, ACCREDITATIONS & PROFILE */}
      <header className="vignan-top-navbar">
        {/* LEFT: VIGNAN OFFICIAL LOGO */}
        <div className="vignan-logo-container">
          <img
            src="/vignan-logo.png"
            alt="Vignan's Foundation for Science, Technology & Research University"
            style={{ height: "62px", maxWidth: "330px", objectFit: "contain", display: "block" }}
          />
        </div>

        {/* CENTER: AGENT 43 BANNER */}
        <div className="topbar-center-agent">
          <div className="agent-radar-badge">
            <span className="pulse-dot"></span>
            AI LOAN VERIFICATION RADAR
          </div>
          <div className="agent-main-title">
            <span className="title-dash">—</span> AGENT 43 <span className="title-dash">—</span>
          </div>
          <div className="agent-sub-title">
            EDUCATION LOAN SUPPORT AGENT · REAL-TIME MONITOR
          </div>
        </div>

        {/* RIGHT: ACCREDITATION SEALS & USER PROFILE */}
        <div className="topbar-right-group">
          <div className="accreditation-badges">
            <div className="accred-seal ugc" title="UGC Category-1 Deemed to be University">
              <span>UGC</span>
              <small>CAT-1</small>
            </div>
            <div className="accred-seal naac" title="NAAC A+ Accredited">
              <span>NAAC</span>
              <small>A+</small>
            </div>
            <div className="accred-seal nirf" title="NIRF Top Ranked">
              <span>NIRF</span>
              <small>RANK</small>
            </div>
            <div className="accred-seal nba" title="NBA Tier-1 Accredited">
              <span>NBA</span>
              <small>TIER-1</small>
            </div>
          </div>

          <div className="user-profile-chip">
            <div className="profile-avatar">PS</div>
            <div className="profile-details">
              <div className="profile-name">
                Admin <span className="admin-tag">PORTAL</span>
              </div>
              <div className="profile-email">vfstr-loan-support</div>
            </div>
          </div>
        </div>
      </header>

      {/* SUB-ACTION BAR */}
      <div className="sub-action-bar">
        <div className="sub-actions-left">
          <button
            type="button"
            className="run-agent-btn"
            onClick={() => setActivePage("Verification")}
          >
            ▶ Run Verification Agent
          </button>
          <span className="ai-active-pill">
            <span className="status-dot"></span>
            AI Monitoring Active
          </span>
          <span className="vignan-branch-pill">VFSTR Main Campus · Vadlamudi</span>
        </div>

        <div className="last-sync-text">
          Active Engine: <strong>{aiStatus?.active_engine || "AI Ready"}</strong> · Verified by <strong>Vignan Foundation for Science and Technology</strong>
        </div>
      </div>

      {/* BODY WITH SIDEBAR AND MAIN CONTENT */}
      <div className="app">

        {/* DARK NAVY SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-agent-header">
            <div className="agent-icon-box">🛡️</div>
            <div className="agent-sidebar-title">
              <div className="agent-sidebar-name">
                AGENT 43 <span className="star-badge">✨</span>
              </div>
              <div className="agent-sidebar-desc">
                Education Loan Support Agent
              </div>
            </div>
          </div>

          <div className="human-in-the-loop-card">
            <strong>HUMAN-IN-THE-LOOP</strong>
            Institutional verification assistant with official college seal & fraud detection for VFSTR.
          </div>

          <nav>
            {[
              { name: "Dashboard", icon: "📊" },
              { name: "Students", icon: "👥" },
              { name: "Document Requests", icon: "📑" },
              { name: "Bank Requirements", icon: "🏦" },
              { name: "Documents", icon: "📄" },
              { name: "Verification", icon: "🔍" },
              { name: "Disbursement", icon: "💰" },
              { name: "Reports", icon: "📈" }
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                className={
                  activePage === item.name
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => {
                  setActivePage(item.name);
                  setMessage("");
                }}
              >
                <span style={{ fontSize: "22px" }}>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="main">
          {activePage === "Dashboard"
            ? dashboard
            : activePage === "Students"
            ? studentsPage
            : activePage === "Document Requests"
            ? documentRequestsPage
            : activePage === "Bank Requirements" ? (
                <>
                  <div className="page-title">
                    <h1>Bank Requirements</h1>
                    <p>Documents required for education loan processing.</p>
                  </div>
                  <div className="card">
                    <h2>Required Documents</h2>
                    {bankRequirements.map((item: any, index: number) => (
                      <div key={index} className="request-row">
                        <span>{item.document_type}</span>
                        <strong>{item.required ? "Required" : "Optional"}</strong>
                      </div>
                    ))}
                  </div>
                </>
              )
            : activePage === "Documents"
            ? documentsPage
            : activePage === "Verification"
            ? verificationPage
            : activePage === "Disbursement"
            ? disbursementPage
            : activePage === "Reports"
            ? reportsPage
            : placeholderPage}
        </main>

      </div>

    </div>
  );
}








