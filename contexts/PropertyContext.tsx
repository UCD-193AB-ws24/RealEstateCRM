import type React from "react"
import { createContext, useState, useContext } from "react"

export interface Property {
  id: string
  address: string
  images: string[]
  tags: string[]
  notes: string
}

interface PropertyContextType {
  properties: Property[]
  addProperty: (property: Property) => void
  updateProperty: (id: string, updates: Partial<Property>) => void
  removeProperty: (id: string) => void
  sortProperties: (tag: string) => void
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
      tags: ["seen", "contacted"],
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
      tags: ["in discussion"],
      notes: "Modern interior, recently renovated. Close to downtown and amenities.",
    },
  ])

  const addProperty = (property: Property) => {
    setProperties([...properties, property])
  }

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties(properties.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id))
  }

  const sortProperties = (tag: string) => {
    setProperties(
      [...properties].sort((a, b) => {
        const aHasTag = a.tags.includes(tag)
        const bHasTag = b.tags.includes(tag)
        return aHasTag === bHasTag ? 0 : aHasTag ? -1 : 1
      }),
    )
  }

  return (
    <PropertyContext.Provider value={{ properties, addProperty, updateProperty, removeProperty, sortProperties }}>
      {children}
    </PropertyContext.Provider>
  )
}

