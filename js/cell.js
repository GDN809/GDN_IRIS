// ----------------- main routine ------  
import * as THREE from "three/webgpu";
import { lineTo,dot,sphere,sphereVec, lineT2 } from './initGrModelGM.js' 
//let cl = new Array[ 0x0000ff, 0x00ff00, 0xff0000 ]

   export class Cell {			// ****** Cell Object ******
    constructor(cellNo) { this.cellNo = cellNo }

    properties
	    cellNo = 0;
		cl = new Array()	//( 0x0000ff, 0x00ff00, 0xff0000 )
	    grp =  new Array( new THREE.Vector4( 4,4,0,0 ) ); 	// coodinate of grow point
	    grlink = [0];										// link to the prev grk 
		ht = new Array( new THREE.Vector4( 0,0,0,0 ) )		// target data point
		somaL = new Array( new THREE.Vector3( 0,0,0 ) )		// for 3D  model
		somaR = new Array( new THREE.Vector3( -0,0,0 ) )	// for 3D' model
		outw = 0

	    grk = 0; 				// gr counter  ( Grow point counter )
	    dmk = 0;				// nearest mt( axon Terminal ) number
	    dmck = new Array();		// mt No. connected

	    dmin = 0;				// min distance from target
	    line = new Array();		// save the line obj

    methods		// ******************************************************************
	  init(c) { this.grp[0] = new THREE.Vector4( 5.84, 2.95-c*0.1, 0, 0 ); // Ave x=5.84  y=3.05  z=3.75  w=1.19
				this.cl = 0xff*(0x100**c); this.cellNo = c; if (c==1) { this.cl = 0x00aa00}
				this.somaL = sphereVec( this.grp[0], 0.04, this.cl ); 
				this.somaR = sphere( -this.grp[0].x, this.grp[0].y, this.grp[0].z, 0.04, this.cl ); 
	   }

	  getv() {		// *** get vector and grow dendrite ***
		    var v = new THREE.Vector4, vv = new THREE.Vector4, rt = false
		    var  sv, lv, nextk,  maxv, mx,my, hsl, sphV, lmatC = (this.cellNo)/10;

		v = this.sumV( this.grp[this.grk] );		// grp[0] is the start point ( soma )
		if  ( this.dmin > 0.1 ) {			// ---- if gp is far from the target----
			v.normalize()
			v.multiplyScalar(0.02) 	//0.02
			vv.addVectors( this.grp[this.grk],v);
				
			this.line[this.grk] = lineTo( 
				this.grp[this.grk].x, this.grp[this.grk].y,this.grp[this.grk].z, vv.x, vv.y, vv.z, this.cl )
			this.line[this.grk] = lineTo( 
				-this.grp[this.grk].x, this.grp[this.grk].y,this.grp[this.grk].w, -vv.x, vv.y, vv.w, this.cl )
	
			this.grk++;		 // next gr counter
			this.grp[this.grk] = new THREE.Vector4;
			this.grp[this.grk] = this.grp[this.grk].addVectors( this.grp[this.grk-1] ,v )
		}
		else { 		// ---- gp is now near the MT ----
			this.line[this.grk] = lineTo(  this.grp[this.grk].x, this.grp[this.grk].y, this.grp[this.grk].z,
				h[this.dmk].x,  h[this.dmk].y, h[this.dmk].z, this.cl ); 	// line to target
			this.line[this.grk] = lineTo(  -this.grp[this.grk].x, this.grp[this.grk].y, this.grp[this.grk].w,
				-h[this.dmk].x,  h[this.dmk].y, h[this.dmk].w,this.cl ); 	// line to target
			this.ht.push( h[this.dmk] ); //console.log(this.cellNo,this.ht)
							
			window.mt[this.dmk] = 0;					// update active target map	
			this.dmck.push( this.dmk ); 			// save the MT No
				//this.dmcp[this.dmk] = this.grk;		// this grk points to the MT
			this.grlink[ this.grk ] = this.grk-1	// grlink must back to the last grk
				//this.nods.push(this.grk); this.nodv.push(0); this.nodw.push(0)
				
			maxv=0;		// search next gp
			for ( let k=0; k<this.grk; k++ ) {
				sv =this.sumV( this.grp[k] ); 	// sv is sum of distance from MTs 
				lv = sv.lengthSq();				// lv is len of min sv
				if ( lv>maxv ) { maxv = lv; nextk = k };	// min lv is max vec = new node
			};						
			if ( maxv>0 ) { 			// ----- found new node ---- 
				this.grk++; 
				this.grp[this.grk] = this.grp[nextk];		// nextk is new node 
				this.grlink[ this.grk ] = nextk;
			}
			  rt = true; //this.ht.push( this.grp[this.grk] ); console.log(this.grp[this.grk-1],h[this.dmk])
			  
			};	
	  return rt
	}					// *** end of getv ***
	
	 sumV( S ) {		// *** returns Vec of min.distance(=maxV) S:grp ***
	   var v = new THREE.Vector4(0,0,0,0), d, mk, mx,my;
	   var vmax = new THREE.Vector4(0,0,0,0)
	     this.dmin=1000; mk=0; 	
		for ( let k=0; k<window.spn; k++ ) { 	// window.spn = 5
		   if ( window.mt[ k ] == 1 ) { mk++; 
			vmax.subVectors( window.h[k], S ); 		// vec h[k] - S																					
			d = vmax.lengthSq();	d = d*d/25;  	// sum of grad /25
			vmax.divideScalar( d )
			v.add(vmax);
			if ( d<this.dmin ) { this.dmin = d; this.dmk = k; }
		   }
		}	
		if ( mk==0 ) { window.tn = 0 }		// Acive target is none										
	  return v;  
	 }			// *** end of sumV ***

	 outV(S) {		
		let dv,  maxv = 0, outv = 0, H = new Array( new THREE.Vector4( 0,0,0,0 ) )
			for ( let k=1; k<this.ht.length; k++ ) {		// distance from active Mt 	window.spn
				H = this.ht[k]
				//H.x = H.x+0.001; H.y = H.y+0.001; H.z = H.z+0.001; H.w = H.w+0.001	
				dv =  Math.pow(S.x-H.x, 2) + Math.pow(S.y-H.y, 2) + Math.pow(S.z-H.z, 2) + Math.pow(S.w-H.w, 2) 
					if ( dv==0 ) { console.log(this.cellNo,k,S,H) }
					dv = 1/dv; outv = outv + dv 
					if ( dv>maxv ) { maxv = dv }
			}
			this.outw = outv + maxv		
		return outv
	 }
}			// ****** End of Cell Object ******

let cell = new Array()
export { cell };
