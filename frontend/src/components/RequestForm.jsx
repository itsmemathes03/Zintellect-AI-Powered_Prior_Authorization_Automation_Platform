import axios from "axios"

export default function RequestForm({

  formData = {},

  setFormData,

  providers = []

}) {

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value,
    })
  }

  // ==========================================
  // FETCH INSURANCE DETAILS
  // ==========================================

  const fetchInsuranceDetails = async (
    insuranceId
  ) => {

    // EMPTY SAFETY

    if (!insuranceId) {

      return
    }

    try {

      const response =
        await axios.get(

          `${import.meta.env.VITE_API_URL}/insurance-details/${insuranceId}`
        )

      const data = response.data

      // SUCCESS

      if (
        data.status === "Success"
      ) {

        setFormData((prev) => ({

          ...prev,

          patientName:
            data.patient_name,

          insuranceProvider:
            data.insurance_provider,

          patientId:
            data.policy_number,

          insuranceId:
            data.insurance_id
        }))

      } else {

        alert(
          "Insurance details not found"
        )
      }

    } catch (error) {

      console.error(error)

      alert(
        "Failed to fetch insurance details"
      )
    }
  }

  return (

    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

      {/* HEADER */}

      <div className="mb-8">

        <h2 className="text-3xl font-bold text-blue-950">

          Doctor Prior Authorization Request

        </h2>

        <p className="text-gray-500 mt-2 leading-7">

          Submit healthcare documents for AI-powered
          insurance authorization review.

        </p>

      </div>

      {/* AUTO FILL NOTICE */}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">

        <h3 className="text-blue-900 font-semibold text-lg">

          Smart Insurance Auto-Fill

        </h3>

        <p className="text-blue-700 mt-2 leading-7">

          Enter the patient's Insurance ID and the system
          will automatically retrieve:

        </p>

        <ul className="mt-3 text-blue-800 list-disc list-inside space-y-1">

          <li>Patient Name</li>

          <li>Insurance Provider</li>

          <li>Policy Information</li>

          <li>Coverage Details</li>

        </ul>

      </div>

      {/* PATIENT INFORMATION */}

      <div className="mb-8">

        <h3 className="text-lg font-semibold text-gray-700 mb-4">

          Patient Information

        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <input
            type="text"
            name="patientName"
            placeholder="Patient Name"
            value={formData.patientName || ''}
            className="border border-gray-300 p-4 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            onChange={handleChange}
          />

          <input
            type="text"
            name="patientId"
            placeholder="Policy Number"
            value={formData.patientId || ''}
            className="border border-gray-300 p-4 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            onChange={handleChange}
          />

        </div>

      </div>

      {/* CLINICAL INFORMATION */}

      <div className="mb-8">

        <h3 className="text-lg font-semibold text-gray-700 mb-4">

          Clinical Information

        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <input
            type="text"
            name="diagnosis"
            placeholder="Diagnosis"
            value={formData.diagnosis || ''}
            className="border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            onChange={handleChange}
          />

          <input
            type="text"
            name="procedureCode"
            placeholder="Procedure Code"
            value={formData.procedureCode || ''}
            className="border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            onChange={handleChange}
          />

        </div>

      </div>

      {/* DOCTOR INFORMATION */}

      <div className="mb-8">

        <h3 className="text-lg font-semibold text-gray-700 mb-4">

          Doctor Information

        </h3>

        <input
          type="text"
          name="doctorName"
          placeholder="Doctor Name"
          value={formData.doctorName || ''}
          className="w-full border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          onChange={handleChange}
        />

      </div>

      {/* INSURANCE INFORMATION */}

      <div>

        <h3 className="text-lg font-semibold text-gray-700 mb-4">

          Insurance Verification

        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* PROVIDER DROPDOWN */}

          <select
            name="insuranceProvider"
            value={formData.insuranceProvider || ''}
            className="border border-gray-300 p-4 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            onChange={handleChange}
          >

            <option value="">

              Select Insurance Provider

            </option>

            {

              providers.map((provider) => (

                <option
                  key={provider.provider_id}
                  value={provider.provider_name}
                >

                  {provider.provider_name}

                </option>
              ))
            }

          </select>

          {/* INSURANCE ID */}

          <input
            type="text"
            name="insuranceId"
            placeholder="Enter Insurance ID"
            value={formData.insuranceId || ''}
            className="border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            onChange={handleChange}

            // AUTO FETCH

            onBlur={(e) =>

              fetchInsuranceDetails(
                e.target.value
              )
            }
          />

        </div>

      </div>

    </div>
  )
}