import type React from "react"
import { createContext, useState, useContext } from "react"

export interface Property {
  id: string
  address: string
  images: string[]
  status: string
  notes: string
}

interface PropertyContextType {
  properties: Property[]
  addProperty: (property: Property) => void
  updateProperty: (id: string, updates: Partial<Property>) => void
  removeProperty: (id: string) => void
  sortProperties: (status: string) => void
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined)

export const usePropertyContext = () => {
  const context = useContext(PropertyContext)
  if (!context) {
    throw new Error("usePropertyContext must be used within a PropertyProvider")
  }
  return context
}

export const PropertyProvider: React.FC = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([
    {
      id: "1",
      address: "123 Main St, Anytown, USA",
      images: [
        "https://picsum.photos/id/1018/300/200",
        "https://picsum.photos/id/1015/300/200",
        "https://picsum.photos/id/1019/300/200",
      ],
      status: "seen",
      notes: "Needs new roof, but great potential. Large backyard perfect for families.",
    },
    {
      id: "2",
      address: "456 Elm St, Somewhere, USA",
      images: [
        "https://picsum.photos/id/1029/300/200",
        "https://picsum.photos/id/1031/300/200",
        "https://picsum.photos/id/1033/300/200",
      ],
      status: "in discussion",
      notes: "Modern interior, recently renovated. Close to downtown and amenities.",
    },
  ])

  const addProperty = (property: Property) => {
    setProperties([...properties, property])
  }

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      const response = await fetch(`http://localhost:5001/api/leads/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
      })
      if (!response.ok) {
        throw new Error("Failed to update property")
      }
      const updatedProperty = await response.json()
      setProperties(properties.map((p) => (p.id === id ? updatedProperty : p)))
    } catch (error) {
      console.error("Error updating property:", error)
    }
  }

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id))
  }

  const sortProperties = (status: string) => {
    setProperties(
      [...properties].sort((a, b) => {
        const aHasStatus = a.status === status
        const bHasStatus = b.status === status
        return aHasStatus === bHasStatus ? 0 : aHasStatus ? -1 : 1
      })
    )
  }

  return (
    <PropertyContext.Provider value={{ properties, addProperty, updateProperty, removeProperty, sortProperties }}>
      {children}
    </PropertyContext.Provider>
  )
}
