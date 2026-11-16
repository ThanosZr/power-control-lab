/* 4.19 (ROADMAP §68): two kernels of the solver of the time domain in C, for WebAssembly: the same operations in the
   same order as the JavaScript (web/studio/sparse.js solve, web/studio/mna.js tlwSources), so the same numbers bit for
   bit. A measurement, not yet in the path of the solver: tools/kernels/bench.js builds this file (clang, wasm32, no
   libc) and prints the time of each kernel in JavaScript and in WebAssembly.
     clang --target=wasm32 -O3 -msimd128 -nostdlib -ffp-contract=off -Wl,--no-entry -Wl,--export-memory \
           -Wl,--initial-memory=67108864 -o kernels.wasm kernels.c
   -ffp-contract=off: no fused multiply-add (JavaScript has none), or the last bit would differ. */
typedef int i32;

/* b <- A^-1 b with the factors of sparse.js lu(): y = P b, L z = y, U w = z, x = Q w */
__attribute__((export_name("solve")))
void solve(i32 n, const i32 *Lp, const i32 *Li, const double *Lx, const i32 *Up, const i32 *Ui, const double *Ux,
           const i32 *pinv, const i32 *q, double *b, double *w) {
  for (i32 k = 0; k < n; k++) w[pinv[k]] = b[k];
  for (i32 j = 0; j < n; j++) { double v = w[j]; if (v == 0) continue; for (i32 p = Lp[j] + 1; p < Lp[j + 1]; p++) w[Li[p]] -= Lx[p] * v; }
  for (i32 j = n - 1; j >= 0; j--) { i32 d = Up[j + 1] - 1; double v = w[j] / Ux[d]; w[j] = v; if (v == 0) continue; for (i32 p = Up[j]; p < d; p++) w[Ui[p]] -= Ux[p] * v; }
  for (i32 k = 0; k < n; k++) b[q[k]] = w[k];
}

/* one end of the Y_c part of the history source of a wideband line: for every pole k and conductor q
   y = E x + a1 v, and hy[r] += w (Rr[k, r, q] yr - Ri[k, r, q] yi) */
__attribute__((export_name("wb")))
void wb(i32 N, i32 M, const double *c, const double *W, const double *Rr, const double *Ri, const double *Xr,
        const double *Xi, const double *vp, double *hy) {
  i32 MM = M * M;
  for (i32 k = 0; k < N; k++) {
    i32 j = 6 * k, kb = k * MM, x = k * M; double Er = c[j], Ei = c[j + 1], a1r = c[j + 4], a1i = c[j + 5], w = W[k];
    for (i32 q = 0; q < M; q++, x++) {
      double xr = Xr[x], xi = Xi[x], vq = vp[q], yr = Er * xr - Ei * xi + a1r * vq, yi = Er * xi + Ei * xr + a1i * vq;
      for (i32 r = 0, ix = kb + q; r < M; r++, ix += M) hy[r] += w * (Rr[ix] * yr - Ri[ix] * yi);
    }
  }
}
