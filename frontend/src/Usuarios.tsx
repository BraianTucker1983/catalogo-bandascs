import { useEffect, useState } from 'react'
import { client } from './lib/api'

export function ListaUsuarios() {
  useEffect(() => {
    async function cargar() {
      // Petición 100% autocompletada y tipada
      const res = await client.api.usuarios.$get()
      const data = await res.json() 
      // 'data' ya está automáticamente tipado como Array<{ id: number, nombre: string, rol: string }>
      console.log(data[0].nombre)
    }
    cargar()
  }, [])

  return <div>Lista cargada</div>
}