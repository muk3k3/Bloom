import { api } from "@/lib/api";

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  cantidadProductos: number;
}

export const categoriasApi = {
  listar: () => api.get<Categoria[]>("/categorias"),
  crear: (cuerpo: { nombre: string }) => api.post<Categoria>("/categorias", cuerpo),
  renombrar: (id: string, cuerpo: { nombre: string }) =>
    api.patch<Categoria>(`/categorias/${id}`, cuerpo),
  borrar: (id: string) => api.delete<void>(`/categorias/${id}`),
};
