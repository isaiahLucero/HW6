function createCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);
  const faceNormals = [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
  const normals = new Float32Array(faceNormals.flatMap(n => [...n, ...n, ...n, ...n]));

  // Tangent; bitangent = cross(N, T)
  const faceTangents = [[1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, -1], [0, 0, 1]];
  const tangents = new Float32Array(faceTangents.flatMap(t => [...t, ...t, ...t, ...t]));

  const texCoords = new Float32Array(faceNormals.flatMap(() => [0, 0, 1, 0, 1, 1, 0, 1]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, tangents, texCoords, indices };
}


function createCylinder(segments = 64, uRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  // Side: theta grows with u, so T points along the circle and B = cross(N, T) points up
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, theta = 2 * Math.PI * u;
    const s = Math.sin(theta), c = Math.cos(theta);
    for (const y of [-1, 1]) {
      positions.push(s, y, c);
      normals.push(s, 0, c);
      tangents.push(c, 0, -s);
      texCoords.push(u * uRepeat, (y + 1) / 2);
    }
  }
  for (let i = 0; i < segments; i++) {
    const k = 2 * i;
    indices.push(k, k + 2, k + 3, k, k + 3, k + 1);
  }

  // Caps: planar mapping of x, z into the texture, T = +x on both
  for (const y of [1, -1]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, y, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const s = Math.sin(theta), c = Math.cos(theta);
      positions.push(s, y, c);
      normals.push(0, y, 0);
      tangents.push(1, 0, 0);
      texCoords.push(0.5 + 0.5 * s, 0.5 - 0.5 * y * c);  // keeps cross(N, T) along +v
    }
    for (let i = 0; i < segments; i++) {
      const a = center + 1 + i, b = a + 1;
      if (y > 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createSphere(r, vSteps, uSteps){
  const pos = [];
  const idx = [];
  const nrm = [];
  const tangent = [];
  const textCoords = [];

  for(let i = 0; i <= vSteps; i++){
    const v = i * Math.PI / vSteps;
    const sinv = Math.sin(v);
    const cosv = Math.cos(v);
    for(let j = 0; j <= uSteps; j++){
      const u = j * 2 * Math.PI / uSteps;
      const sinu = Math.sin(u);
      const cosu = Math.cos(u); 
      const x = cosu * sinv;
      const y = sinu * sinv;
      const z = cosv;
      
      pos.push([r * x,r * y,r * z]);
      tangent.push(-sinu, cosu, 0);
      textCoords.push(i / vSteps, 1 - (j / uSteps));
    }
  }

  for(let i = 0; i < vSteps; i++){
    for(let j = 0; j < uSteps; j++){
      const k1 = (i * (uSteps + 1)) + j;
      const k2 = k1 + uSteps + 1;
      idx.push(k1, k2, k1 + 1);
      idx.push(k2, k2 + 1, k1 + 1);
    }
  }

    const adjIdx = [];
  // calculate each adjacent vertices
  for(let i = 0; i <= vSteps; i++){
    for(let j = 0; j <= uSteps; j++){
      const rowN = (i == 0) ? vSteps : i - 1;
      const colN = j;

      const rowW = i;
      const colW = (j == 0) ? uSteps : j - 1;

      const rowS = (i == vSteps) ? 0 : i + 1;
      const colS = j; 

      const rowE = i;
      const colE = (j == uSteps) ? 0 : j + 1;

      // Wraps as well
      const numCols = uSteps + 1;
      const idxN = rowN * numCols + colN;
      const idxW = rowW * numCols + colW;
      const idxE = rowE * numCols + colE;
      const idxS = rowS * numCols + colS;
      
      adjIdx.push([idxN, idxW, idxS, idxE]);
    }
  }

  for(let i = 0; i < pos.length; i++){
    const neighbN = adjIdx[i][0];
    const neighbW = adjIdx[i][1];
    const neighbS = adjIdx[i][2];
    const neighbE = adjIdx[i][3];
    
    // IMPORTANT: NEED TO BE PRODUCED COUNTER CLOCKWISE TO CENTER
    // so normals don't point inward
    let n1 = normalVector(pos[i], pos[neighbW], pos[neighbN]);
    let n2 = normalVector(pos[i], pos[neighbN], pos[neighbE]);
    let n3 = normalVector(pos[i], pos[neighbE], pos[neighbS]);
    let n4 = normalVector(pos[i], pos[neighbS], pos[neighbW]);

    nrm.push(computeNormal(n1, n2, n3, n4));
  }

  return { 
    positions: new Float32Array(pos.flat()), 
    normals: new Float32Array(nrm.flat()), 
    tangents: new Float32Array(tangent),
    texCoords: new Float32Array(textCoords),
    indices: new Uint16Array(idx) };
}

function createTorus(R, r, uSteps, vSteps){
  const pos = [];
  const nrm = [];
  const idx = [];
  const tangent = [];
  const textCoords = [];

  for(let i = 0; i <= uSteps; i++){
    const u = i * 2 * Math.PI / uSteps;
    const sinu = Math.sin(u);
    const cosu = Math.cos(u);
    for(let j = 0; j <= vSteps; j++){
      const v = j * 2 * Math.PI / vSteps;
      const sinv = Math.sin(v);
      const cosv = Math.cos(v);
      const x = (R + r * cosv) * cosu;
      const y = (R + r * cosv) * sinu;
      const z = r * sinv;

      pos.push([x, y, z]);
      tangent.push(-sinu, cosu, 0);
      textCoords.push(i / uSteps, j / vSteps);
    }
  }

  for(let i = 0; i < uSteps; i++){
    for(let j = 0; j < vSteps; j++){
        const k1 = (i * (vSteps + 1)) + j;
        const k2 = (i + 1) * (vSteps + 1) + j;
        idx.push(k1, k1 + 1, k2);
        idx.push(k1 + 1, k2 + 1, k2);
    }
  }

  /*
    Step 1: Calculate the adjacent vertices for each vertex at each index
    Step 2: Add each face normal and save it for ones already calculated
    Step 3: Average each face normal touching the vertex 
  */
  const adjIdx = [];
  // calculate each adjacent vertices
  for(let i = 0; i <= uSteps; i++){
    for(let j = 0; j <= vSteps; j++){
      const rowN = i;
      const colN = (j == 0) ? vSteps : j - 1;

      const rowW = (i == 0) ? uSteps : i - 1;
      const colW = j;

      const rowS = i;
      const colS = (j == vSteps) ? 0 : j + 1; 

      const rowE = (i == uSteps) ? 0 : i + 1;
      const colE = j;

      // Wraps as well
      const numCols = vSteps + 1;
      const idxN = rowN * numCols + colN;
      const idxW = rowW * numCols + colW;
      const idxE = rowE * numCols + colE;
      const idxS = rowS * numCols + colS;
      
      adjIdx.push([idxN, idxW, idxS, idxE]);
    }
  }

  // Compute average for every face normal vertex touches
  for(let i = 0; i < pos.length; i++){
    const neighbN = adjIdx[i][0];
    const neighbW = adjIdx[i][1];
    const neighbS = adjIdx[i][2];
    const neighbE = adjIdx[i][3];
    
    // IMPORTANT: NEED TO BE PRODUCED COUNTER CLOCKWISE TO CENTER
    // so normals don't point inward
    let n1 = normalVector(pos[i], pos[neighbW], pos[neighbN]);
    let n2 = normalVector(pos[i], pos[neighbN], pos[neighbE]);
    let n3 = normalVector(pos[i], pos[neighbE], pos[neighbS]);
    let n4 = normalVector(pos[i], pos[neighbS], pos[neighbW]);

    nrm.push(computeNormal(n1, n2, n3, n4));
  }
  
  return {
     positions: new Float32Array(pos.flat()), 
     normals: new Float32Array(nrm.flat()), 
     tangents: new Float32Array(tangent),
     texCoords: new Float32Array(textCoords),
     indices: new Uint16Array(idx)
  };
}

function createCone(uSteps, vSteps, h){
  const pos = [];
  const nrm = [];
  const idx = [];
  const tangent = [];
  const textCoords = [];

  for(let j = 0; j < vSteps; j++){
    const z = (j * h) / (vSteps - 1); 
    const r = (j * h) / (vSteps - 1);
    for(let i = 0; i < uSteps; i++){
      const u = i * 2 * Math.PI / uSteps;
      const sinu = Math.sin(u);
      const cosu = Math.cos(u);

      x = r * cosu;
      y = r * sinu;
      pos.push(x, y, z);
      nrm.push(cosu / Math.sqrt(2), sinu / Math.sqrt(2), -1 / Math.sqrt(2));
      tangent.push(-sinu, cosu, 0);
      textCoords.push(i / uSteps, j / (vSteps - 1));
    }
  }

  for(let i = 0; i < vSteps - 1; i++){
    for(let j = 0; j < uSteps; j++){
      const nextCol = (j + 1) % uSteps;

      const k1 = (i * uSteps) + j;
      const k2 = (i * uSteps) + nextCol;
      const k3 = ((i + 1) * uSteps) + j;
      const k4 = ((i + 1) * uSteps) + nextCol; 
      idx.push(k1, k2, k3);
      idx.push(k2, k4, k3);
    }
  }

  return {
    positions: new Float32Array(pos), 
    normals: new Float32Array(nrm), 
    tangents: new Float32Array(tangent),
    texCoords: new Float32Array(textCoords),
    indices: new Uint16Array(idx)
  };
}

// P is initial vector
function normalVector(P, Q, R){
  PQ = [
    Q[0] - P[0],
    Q[1] - P[1],
    Q[2] - P[2]
  ];

  PR = [
    R[0] - P[0],
    R[1] - P[1],
    R[2] - P[2]
  ];

  n = [
    PQ[1] * PR[2] - PQ[2] * PR[1],
    -1 * (PQ[2] * PR[0] - PQ[0] * PR[2]),
    PQ[0] * PR[1] - PQ[1] * PR[0]
  ];

  magnitude = Math.sqrt(Math.pow(n[0], 2) + Math.pow(n[1], 2) + Math.pow(n[2], 2));

  return [n[0] / magnitude, n[1] / magnitude, n[2] / magnitude];
}

function computeNormal(n1, n2, n3, n4){
  const x = n1[0] + n2[0] + n3[0] +  n4[0];
  const y = n1[1] + n2[1] + n3[1] +  n4[1];
  const z = n1[2] + n2[2] + n3[2] +  n4[2];

  let mtg = Math.sqrt(x * x + y * y + z * z);
  
  if(mtg == 0) return;
  return [x / mtg, y / mtg, z / mtg];
}