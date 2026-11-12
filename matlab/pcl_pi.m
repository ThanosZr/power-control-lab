function [u, cs] = pcl_pi(r, m, cs, dt)
%PCL_PI  A discrete PI with clamping, for PclPlant.loop and pcl_plant_gui (4.8.1): u = u0 + Kp·e + x, x += Ki·dt·e,
%   with e = r − m(1). Outside [lo, hi] the output is clipped and the integral stops while the error pushes outwards.
%   cs: Kp, Ki, and optionally u0 (feedforward, 0), lo, hi (−Inf, Inf), x (the integral, 0).
%   [u, cs] = pcl_pi(100, p.m, struct('Kp', 0.004, 'Ki', 0.1, 'lo', 0, 'hi', 1), 2e-3)
if ~isfield(cs, 'x'), cs.x = 0; end
if ~isfield(cs, 'u0'), cs.u0 = 0; end
if ~isfield(cs, 'lo'), cs.lo = -Inf; end
if ~isfield(cs, 'hi'), cs.hi = Inf; end
e = r - m(1);
x = cs.x + cs.Ki * dt * e;
u = cs.u0 + cs.Kp * e + x;
if u > cs.hi
  u = cs.hi; if e > 0, x = cs.x; end
elseif u < cs.lo
  u = cs.lo; if e < 0, x = cs.x; end
end
cs.x = x;
end
