function DashboardCards() {

  const cards = [

    {

      title: "Total Requests",

      value: "124",

      color: "bg-blue-500"
    },

    {

      title: "Approved",

      value: "89",

      color: "bg-green-500"
    },

    {

      title: "Manual Review",

      value: "21",

      color: "bg-yellow-500"
    },

    {

      title: "Rejected",

      value: "14",

      color: "bg-red-500"
    }
  ]

  return (

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      {

        cards.map((card, index) => (

          <div

            key={index}

            className="bg-white rounded-3xl shadow-xl p-6 hover:scale-105 transition-all duration-300"
          >

            <div className={`w-14 h-14 rounded-2xl ${card.color} mb-4`}>

            </div>

            <h2 className="text-gray-500 text-lg">

              {card.title}

            </h2>

            <h1 className="text-4xl font-bold text-primary mt-2">

              {card.value}

            </h1>
          </div>
        ))
      }
    </div>
  )
}

export default DashboardCards