/****************************************************************************** 
	ntree.js - General-Purpose Non-Recursive Bounding-Volume Hierarchy Library
	Version 0.2.1, April 3rd 2010

  Copyright (c) 2010 Jon-Carlos Rivera

  This software is provided 'as-is', without any express or implied
  warranty.  In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.

	Jon-Carlos Rivera - imbcmdth@hotmail.com
******************************************************************************/
var isArray = function(o) {
	return Object.prototype.toString.call(o) === '[object Array]'; 
};

/**
 * RTree - A simple r-tree structure for great results.
 * @constructor
 */
var NTree = function(dimensions, width){
	// Variables to control tree-dimensions
	var _Min_Width = 3;  // Minimum width of any node before a merge
	var _Max_Width = 6;  // Maximum width of any node before a split
	var _Dimensions = 2;  // Number of "interval pairs" per node
	if(!isNaN(dimensions)){ _Dimensions = dimensions;}
	if(!isNaN(width)){ _Min_Width = Math.floor(width/2.0); _Max_Width = width;}
	// Start with an empty root-tree
	
	var _intervals = NTree.Interval.make_Empty(_Dimensions);
	var _T = {d:_intervals, id:"root", nodes:[] };

	/* @function
	 * @description Function to generate unique strings for element IDs
	 * @param {String} n			The prefix to use for the IDs generated.
	 * @return {String}				A guarenteed unique ID.
	 */
    var _name_to_id = (function() {
        // hide our idCache inside this closure
        var idCache = {};

        // return the api: our function that returns a unique string with incrementing number appended to given idPrefix
        return function(idPrefix) {
            var idVal = 0;
            if(idPrefix in idCache) {
                idVal = idCache[idPrefix]++;
            } else {
                idCache[idPrefix] = 0;
            }
            return idPrefix + "_" + idVal;
        }
    })();	
    
	// This is my special addition to the world of r-trees
	// every other (simple) method I found produced crap trees
	// this skews insertions to prefering squarer and emptier nodes
	NTree.Interval.jons_ratio = function(dimensions, intervals, count) {
	  // Area of new enlarged rectangle
		var i, sum = 0, mul = 1;
		for( i = 0; i < dimensions; i++ )
		{
			sum +=  intervals[i].b;
			mul *=  intervals[i].b;
		}
		sum /= dimensions;
	  var lgeo = mul / Math.pow(sum, dimensions);
		
	  // return the ratio of the perimeter to the area - the closer to 1 we are, 
	  // the more "square" or "cubic" a volume is. conversly, when approaching zero the 
	  // more elongated a rectangle is

	  return(mul * count / lgeo); 
	};
	
	/* find the best specific node(s) for object to be deleted from
	 * [ leaf node parent ] = _remove_subtree(rectangle, object, root)
	 * @private
	 */
	var _remove_subtree = function(options) {
		var hit_stack = []; // Contains the elements that overlap
		var count_stack = []; // Contains the elements that overlap
		var ret_array = [];
		var current_depth = 1;
		var intervals = options.intervals;
		var obj = options.object;
		var root = options.root;
		var comparators = options.comparators;
		
		if(!intervals || !comparators.overlap_intervals(intervals, root.d))
		 return ret_array;

		var ret_obj = {d:NTree.Interval.make_Intervals(_Dimensions, intervals), target:obj};
		
		count_stack.push(root.nodes.length);
		hit_stack.push(root);

		do {
			var tree = hit_stack.pop();
			var i = count_stack.pop()-1;
			
		  if("target" in ret_obj) { // We are searching for a target
				while(i >= 0)	{
					var ltree = tree.nodes[i];
					if(comparators.overlap_intervals(ret_obj.d, ltree.d)) {
						if( (ret_obj.target && "leaf" in ltree && ltree.leaf === ret_obj.target)
							||(!ret_obj.target && ("leaf" in ltree || comparators.contains_intervals(ltree.d, ret_obj.d)))) { // A Match !!
				  		// Yup we found a match...
				  		// we can cancel search and start walking up the list
				  		if("nodes" in ltree) {// If we are deleting a node not a leaf...
				  			ret_array = _search_subtree({intervals:ltree.d, return_nodes:true, return_array:[], root:ltree, comparators:comparators});
				  			tree.nodes.splice(i, 1); 
				  		} else {
								ret_array = tree.nodes.splice(i, 1); 
							}
							// Resize MBR down...
							NTree.Interval.make_MBV(_Dimensions, tree.nodes, tree.d);
							delete ret_obj.target;
							if(tree.nodes.length < _Min_Width) { // Underflow
								ret_obj.nodes = _search_subtree({intervals:tree.d, return_nodes:true, return_array:[], root:tree, comparators:comparators});
							}
							break;
			  		}/*	else if("load" in ltree) { // A load
				  	}*/	else if("nodes" in ltree) { // Not a Leaf
				  		current_depth += 1;
				  		count_stack.push(i);
				  		hit_stack.push(tree);
				  		tree = ltree;
				  		i = ltree.nodes.length;
				  	}
				  }
					i -= 1;
				}
			} else if("nodes" in ret_obj) { // We are unsplitting
				tree.nodes.splice(i+1, 1); // Remove unsplit node
				// ret_obj.nodes contains a list of elements removed from the tree so far
				if(tree.nodes.length > 0)
					NTree.Interval.make_MBV(_Dimensions, tree.nodes, tree.d);
				for(var t = 0;t<ret_obj.nodes.length;t++)
					_insert_subtree({node:ret_obj.nodes[t], root:tree, comparators:comparators});
				ret_obj.nodes.length = 0;
				if(hit_stack.length == 0 && tree.nodes.length <= 1) { // Underflow..on root!
					ret_obj.nodes = _search_subtree({intervals:tree.d, return_nodes:true, return_array:ret_obj.nodes, root:tree, comparators:comparators});
					tree.nodes.length = 0;
					hit_stack.push(tree);
					count_stack.push(1);
				} else if(hit_stack.length > 0 && tree.nodes.length < _Min_Width) { // Underflow..AGAIN!
					ret_obj.nodes = _search_subtree({intervals:tree.d, return_nodes:true, return_array:ret_obj.nodes, root:tree, comparators:comparators});
					tree.nodes.length = 0;						
				}else {
					delete ret_obj.nodes; // Just start resizing
				}
			} else { // we are just resizing
				NTree.Interval.make_MBV(_Dimensions, tree.nodes, tree.d);
			}
			current_depth -= 1;
		}while(hit_stack.length > 0);
		
		return(ret_array);
	};

	/* choose the best damn node for rectangle to be inserted into
	 * [ leaf node parent ] = _choose_leaf_subtree(rectangle, root to start search at)
	 * @private
	 */
	var _choose_leaf_subtree = function(options) {
		var best_choice_index = -1;
		var best_choice_stack = [];
		var best_choice_area;
		var intervals = options.intervals;
		var root = options.root;
		var comparators = options.comparators;
		
		var load_callback = function(local_tree, local_node){
			return(function(data) { 
				local_tree._attach_data(local_node, data);
			});
		};
	
		best_choice_stack.push(root);
		var nodes = root.nodes;	

		do {	
			if(best_choice_index != -1)	{
				best_choice_stack.push(nodes[best_choice_index]);
				nodes = nodes[best_choice_index].nodes;
				best_choice_index = -1;
			}
	
			for(var i = nodes.length-1; i >= 0; i--) {
				var ltree = nodes[i];
				if("leaf" in ltree) {  
					// Bail out of everything and start inserting
					best_choice_index = -1;
					break;
			  } /*else if(ltree.load) {
  				throw( "Can't insert into partially loaded tree ... yet!");
  				//jQuery.getJSON(ltree.load, load_callback(this, ltree));
  				//delete ltree.load;
  			}*/
			  // Area of new enlarged rectangle
			  var old_lratio = NTree.Interval.jons_ratio(_Dimensions, ltree.d, ltree.nodes.length+1);

				var copy_of_intervals = NTree.Interval.make_Intervals(_Dimensions, ltree.d);
				NTree.Interval.expand_intervals(copy_of_intervals, intervals);
			  
			  // Area of new enlarged rectangle
			  var lratio = NTree.Interval.jons_ratio(_Dimensions, copy_of_intervals, ltree.nodes.length+2);
			  
			  if(best_choice_index < 0 || Math.abs(lratio - old_lratio) < best_choice_area) {
			  	best_choice_area = Math.abs(lratio - old_lratio); best_choice_index = i;
			  }
			}
		}while(best_choice_index != -1);

		return(best_choice_stack);
	};

	/* split a set of nodes into two roughly equally-filled nodes
	 * [ an array of two new arrays of nodes ] = linear_split(array of nodes)
	 * @private
	 */
	var _linear_split = function(nodes) {
		var n = _pick_linear(nodes);
		while(nodes.length > 0)	{
			_pick_next(nodes, n[0], n[1]);
		}
		return(n);
	};
	
	/* insert the best source rectangle into the best fitting parent node: a or b
	 * [] = pick_next(array of source nodes, target node array a, target node array b)
	 * @private
	 */
	var _pick_next = function(nodes, a, b) {
	  // Area of new enlarged rectangle
		var area_a = NTree.Interval.jons_ratio(_Dimensions, a.d, a.nodes.length+1);
		var area_b = NTree.Interval.jons_ratio(_Dimensions, b.d, b.nodes.length+1);
		var high_area_delta;
		var high_area_node;
		var lowest_growth_group;
		
		for(var i = nodes.length-1; i>=0;i--) {
			var l = nodes[i];

			var copy_of_intervals = NTree.Interval.make_Intervals(_Dimensions, a.d);
			NTree.Interval.expand_intervals(copy_of_intervals, l.d);
			var change_new_area_a = Math.abs(NTree.Interval.jons_ratio(_Dimensions, copy_of_intervals, a.nodes.length+2) - area_a);
	
			copy_of_intervals = NTree.Interval.make_Intervals(_Dimensions, b.d);
			NTree.Interval.expand_intervals(copy_of_intervals, l.d);
			var change_new_area_b = Math.abs(NTree.Interval.jons_ratio(_Dimensions, copy_of_intervals, b.nodes.length+2) - area_b);

			if( !high_area_node || !high_area_delta || Math.abs( change_new_area_b - change_new_area_a ) < high_area_delta ) {
				high_area_node = i;
				high_area_delta = Math.abs(change_new_area_b-change_new_area_a);
				lowest_growth_group = change_new_area_b < change_new_area_a ? b : a;
			}
		}
		var temp_node = nodes.splice(high_area_node, 1)[0];
		if(a.nodes.length + nodes.length + 1 <= _Min_Width)	{
			a.nodes.push(temp_node);
			NTree.Interval.expand_intervals(a.d, temp_node.d);
		}	else if(b.nodes.length + nodes.length + 1 <= _Min_Width) {
			b.nodes.push(temp_node);
			NTree.Interval.expand_intervals(b.d, temp_node.d);
		}
		else {
			lowest_growth_group.nodes.push(temp_node);
			NTree.Interval.expand_intervals(lowest_growth_group.d, temp_node.d);
		}
	};

	/* pick the "best" two starter nodes to use as seeds using the "linear" criteria
	 * [ an array of two new arrays of nodes ] = pick_linear(array of source nodes)
	 * @private
	 */
	var _pick_linear = function(nodes) {
		var lowest_high = new Array(_Dimensions);
		for(i = 0; i < _Dimensions;i++)	lowest_high[i] = nodes.length-1;
		var highest_low = new Array(_Dimensions);
		for(i = 0; i < _Dimensions;i++)	highest_low[i] = 0;
    var t1, t2, l, i, d;
		
		for(i = nodes.length-2; i>=0;i--)	{
			l = nodes[i];
			for(d = 0; d < _Dimensions;d++)	{
				if(l.d[d].a > nodes[highest_low[d]].d[d].a ) highest_low[d] = i;
				else if(l.d[d].a+l.d[d].b < nodes[lowest_high[d]].d[d].a+nodes[lowest_high[d]].d[d].b) lowest_high[d] = i;
			}
		}
		
		d = 0;
		var difference, last_difference = 0;
		for(i = 0; i < _Dimensions;i++)	{
			difference = Math.abs((nodes[lowest_high[i]].d[i].a+nodes[lowest_high[i]].d[i].b) - nodes[highest_low[i]].d[i].a);
			if(difference > last_difference)
			{
				d = i;
				last_difference = difference;
			}
		}		
		
		if(lowest_high[d] > highest_low[d])	{
			t1 = nodes.splice(lowest_high[d], 1)[0];
			t2 = nodes.splice(highest_low[d], 1)[0];
		}	else {
			t2 = nodes.splice(highest_low[d], 1)[0];
			t1 = nodes.splice(lowest_high[d], 1)[0];
		}

		return([{d:NTree.Interval.make_Intervals(_Dimensions, t1.d), nodes:[t1]},
			      {d:NTree.Interval.make_Intervals(_Dimensions, t2.d), nodes:[t2]} ]);
	};
	
	var _attach_data = function(node, more_tree){
		node.nodes = more_tree.nodes;
		node.x = more_tree.x; node.y = more_tree.y;
		node.w = more_tree.w; node.h = more_tree.h;
		return(node);
	};
	
	/* non-recursive internal insert function
	 * [] = _insert_subtree(rectangle, object to insert, root to begin insertion at)
	 * @private
	 */
	var _insert_subtree = function(options/*node, root*/) {
		var bc; // Best Current node
		if( !("node" in options) ) {
			options.node = {d:options.intervals, leaf:options.object};
		}
		var node = options.node;
		var root = options.root;
		var comparators = options.comparators;
		// Initial insertion is special because we resize the Tree and we don't
		// care about any overflow (seriously, how can the first object overflow?)
		if(root.nodes.length == 0) {
			NTree.Interval.make_Intervals(_Dimensions, node.d, root.d);
			root.nodes.push(node);
			return;
		}
		
		// Find the best fitting leaf node
		// choose_leaf returns an array of all tree levels (including root)
		// that were traversed while trying to find the leaf
		var tree_stack = _choose_leaf_subtree({intervals:node.d, root:root, comparators:comparators});
		var ret_obj = node;//{x:rect.x,y:rect.y,w:rect.w,h:rect.h, leaf:obj};
	
		// Walk back up the tree resizing and inserting as needed
		do {
			//handle the case of an empty node (from a split)
			if(bc && "nodes" in bc && bc.nodes.length == 0) {
				var pbc = bc; // Past bc
				bc = tree_stack.pop();
				for(var t=0;t<bc.nodes.length;t++)
					if(bc.nodes[t] === pbc || bc.nodes[t].nodes.length == 0) {
						bc.nodes.splice(t, 1);
						break;
				}
			} else {
				bc = tree_stack.pop();
			}
			
			// If there is data attached to this ret_obj
			if("leaf" in ret_obj || "nodes" in ret_obj || isArray(ret_obj)) { 
				// Do Insert
				if(isArray(ret_obj)) {
					for(var ai = 0; ai < ret_obj.length; ai++) {
						NTree.Interval.expand_intervals(bc.d, ret_obj[ai].d);
					}
					bc.nodes = bc.nodes.concat(ret_obj); 
				} else {
					NTree.Interval.expand_intervals(bc.d, ret_obj.d);
					bc.nodes.push(ret_obj); // Do Insert
				}
	
				if(bc.nodes.length <= _Max_Width)	{ // Start Resizeing Up the Tree
					ret_obj = {d:NTree.Interval.make_Intervals(_Dimensions, bc.d)};
				}	else { // Otherwise Split this Node
					// linear_split() returns an array containing two new nodes
					// formed from the split of the previous node's overflow
					var a = _linear_split(bc.nodes);
					ret_obj = a;//[1];
					
					if(tree_stack.length < 1)	{ // If are splitting the root..
						bc.nodes.push(a[0]);
						tree_stack.push(bc);     // Reconsider the root element
						ret_obj = a[1];
					} /*else {
						delete bc;
					}*/
				}
			}	else { // Otherwise Do Resize
				//Just keep applying the new bounding rectangle to the parents..
				NTree.Interval.expand_intervals(bc.d, ret_obj.d);
				ret_obj = {d:NTree.Interval.make_Intervals(_Dimensions, bc.d)};
			}
		} while(tree_stack.length > 0);
	};

	/* non-recursive internal search function 
	 * [ nodes | objects ] = _search_subtree(intervals, [return node data], [array to fill], root to begin search at)
	 * @private
	 */
	var _search_subtree = function(options) {
		var hit_stack = []; // Contains the elements that overlap
		var intervals = options.intervals;
		var return_node = options.return_nodes;
		var return_array = options.return_array;
		var root = options.root;
		var comparators = options.comparators;

		if(!comparators.overlap_intervals(intervals, root.d))
		 return(return_array);
	
		var load_callback = function(local_tree, local_node){
			return(function(data) { 
				local_tree._attach_data(local_node, data);
			});
		};
	
		hit_stack.push(root.nodes);
	
		do {
			var nodes = hit_stack.pop();
	
			for(var i = nodes.length-1; i >= 0; i--) {
				var ltree = nodes[i];
			  if(comparators.overlap_intervals(intervals, ltree.d)) {
			  	if("nodes" in ltree) { // Not a Leaf
			  		hit_stack.push(ltree.nodes);
			  	} else if("leaf" in ltree) { // A Leaf !!
			  		if(!return_node)
		  				return_array.push(ltree.leaf);
		  			else
		  				return_array.push(ltree);
		  		}/*	else if("load" in ltree) { // We need to fetch a URL for some more tree data
	  				jQuery.getJSON(ltree.load, load_callback(this, ltree));
	  				delete ltree.load;
	  			//	i++; // Replay this entry
	  			}*/
				}
			}
		}while(hit_stack.length > 0);
		
		return(return_array);
	};

	/* quick 'n' dirty function for plugins or manually drawing the tree
	 * [ tree ] = RTree.get_tree(): returns the raw tree data. useful for adding
	 * @public
	 * !! DEPRECATED !!
	 */
	this.get_tree = function() {
		return _T;
	};
	
	/* quick 'n' dirty function for plugins or manually loading the tree
	 * [ tree ] = RTree.set_tree(sub-tree, where to attach): returns the raw tree data. useful for adding
	 * @public
	 * !! DEPRECATED !!
	 */
	this.set_tree = function(new_tree, where) {
		if(!where)
			where = _T;
		return(_attach_data(where, new_tree));
	};
	
	/* non-recursive search function 
	 * [ nodes | objects ] = NTree.search(intervals, [return node data], [array to fill])
	 * @public
	 */
	this.search = function(options /*intervals, return_node, return_array*/) {
		if(arguments.length < 1) {
			throw "Wrong number of arguments. search() requires an options object."
		}
		if( !("intervals" in options) )	{ 
			throw "Wrong number of options. search() requires at least a set of intervals of " + _Dimensions + "-dimensions.";
		}
		if( options.intervals.length != _Dimensions ) {
			throw "Wrong number of dimensions in input volume. The tree has a rank of " + _Dimensions + "-dimensions.";
		}
		if( !("return_nodes" in options) ) {
			options.return_nodes = false; // obj == false for conditionals
		}
		if( !("return_array" in options) ) {
			options.return_array = [];
		}
		if( !("comparators" in options) ) {
			options.comparators = {};
		}
		if( !("overlap_intervals" in options["comparators"]) ) {
			options.comparators.overlap_intervals = NTree.Interval.overlap_intervals; //Defaults
		}
		if( !("contains_intervals" in options["comparators"]) ) {
			options.comparators.contains_intervals = NTree.Interval.contains_intervals;
		}
		options.root = _T; // should not ever be specified by outside

	/*	switch(arguments.length) {
			case 1:
				arguments[1] = false;// Add an "return node" flag - may be removed in future
			case 2:
				arguments[2] = []; // Add an empty array to contain results
			case 3:
				arguments[3] = _T; // Add root node to end of argument list
			default:
				arguments.length = 4;
		}*/
		return(_search_subtree.apply(this, [options]));
	};
		
			
	/* non-recursive insert function
	 * [] = NTree.insert(intervals, object to insert)
	 */
	this.insert = function(options/*intervals, obj*/) {
		if(arguments.length < 1) {
			throw "Wrong number of arguments. insert() requires an options object."
		}
		if( !("intervals" in options) )	{
			throw "Wrong number of options. insert() requires a set of intervals of " + _Dimensions + "-dimensions.";
		}
		if( options.intervals.length != _Dimensions ) {
			throw "Wrong number of dimensions in input volume. The tree has a rank of " + _Dimensions + "-dimensions.";
		}
		if( !("object" in options) ) {
			throw "Wrong number of options. insert() requires an object to insert.";
		}
		if( !("comparators" in options) ) {
			options.comparators = {};
		}
		if( !("overlap_intervals" in options["comparators"]) ) {
			options.comparators.overlap_intervals = NTree.Interval.overlap_intervals; //Defaults
		}
		if( !("contains_intervals" in options["comparators"]) ) {
			options.comparators.contains_intervals = NTree.Interval.contains_intervals;
		}
		options.root = _T; // should not ever be specified by outside
		
		return(_insert_subtree(options/*{d:NTree.Interval.make_Intervals(_Dimensions, intervals), leaf:obj}, _T*/));
	};

	/* non-recursive function that deletes a specific
	 * [ number ] = NTree.remove(intervals, obj)
	 */
	this.remove = function(options/*intervals, obj*/) {
		var arguments_array = [];
		if(arguments.length < 1) {
			throw "Wrong number of arguments. remove() requires an options object."
		}
		if( !("intervals" in options) )	{
			throw "Wrong number of options. remove() requires at least a set of intervals of " + _Dimensions + "-dimensions.";
		}
		if( options.intervals.length != _Dimensions ) {
			throw "Wrong number of dimensions in input volume. The tree has a rank of " + _Dimensions + "-dimensions.";
		}
		if( !("object" in options) ) {
			options.object = false; // obj == false for conditionals
		} 
		if( !("comparators" in options) ) {
			options.comparators = {};
		}
		if( !("overlap_intervals" in options["comparators"]) ) {
			options.comparators.overlap_intervals = NTree.Interval.overlap_intervals; //Defaults
		}
		if( !("contains_intervals" in options["comparators"]) ) {
			options.comparators.contains_intervals = NTree.Interval.contains_intervals;
		}
		options.root = _T; // should not ever be specified by outside
		
		if(options.object === false) { // Do area-wide delete
			var numberdeleted = 0;
			var ret_array = [];
			do { 
				numberdeleted=ret_array.length; 
				ret_array = ret_array.concat(_remove_subtree.apply(this, [options]));
			}while( numberdeleted !=  ret_array.length);
			return ret_array;
		}
		else { // Delete a specific item
			return(_remove_subtree.apply(this, [options]));
		}
	};

};

NTree.Interval = {};

/* returns true if intervals "a" overlaps intervals "b"
 * [ boolean ] = overlap_intervals(intervals a, intervals b)
 * @static function
 */
NTree.Interval.overlap_intervals = function(a, b) {
	var d = a.length; 
	var i, ret_val = true;
	if( b.length != d ) ret_val = false; // Should probably be an error.
	for( i = 0; i < d; i++ )
	{
		ret_val = ret_val && (a[i].a < (b[i].a+b[i].b) && (a[i].a+a[i].b) > b[i].a);
	}
	return ret_val;
};

/* returns true if intervals "a" overlaps intervals "b"
 * [ boolean ] = contains_intervals(intervals a, intervals b)
 * @static function
 */
NTree.Interval.contains_intervals = function(a, b) {
	var d = a.length; 
	var i, ret_val = true;
	if( b.length != d ) ret_val = false; // Should probably be an error.
	for( i = 0; i < d; i++ )
	{
		ret_val = ret_val && ((a[i].a+a[i].b) <= (b[i].a+b[i].b) && a[i].a >= b[i].a);
	}
	return ret_val;
};

/* expands intervals A to include intervals B, intervals B is untouched
 * [ rectangle a ] = expand_rectangle(rectangle a, rectangle b)
 * @static function
 */
NTree.Interval.expand_intervals = function(a, b)	{
	var d = a.length; 
	var i, n;
	if( b.length != d ) return false; // Should probably be an error.
	for( i = 0; i < d; i++ )
	{
		n = Math.min(a[i].a, b[i].a);
		a[i].b = Math.max(a[i].a+a[i].b, b[i].a+b[i].b) - n;
		a[i].a = n;
	}
	return a;
};

/* generates a minimally bounding intervals for all intervals in
 * array "nodes". If intervals is set, it is modified into the MBR. Otherwise,
 * a new set of intervals is generated and returned.
 * [ rectangle a ] = make_MBR(rectangle array nodes, rectangle rect)
 * @static function
 */
NTree.Interval.make_MBV = function(dimensions, nodes, intervals) {
	var d;
	if(nodes.length < 1)
	{	
		//throw "make_MBR: nodes must contain at least one rectangle!";
		return NTree.Interval.make_Empty(dimensions);
	}
		
	if(!intervals)
		intervals = NTree.Interval.make_Intervals(dimensions, nodes[0].d);
	else
		NTree.Interval.make_Intervals(dimensions, nodes[0].d, intervals);
		
	for(var i = nodes.length-1; i > 0; i--)
		NTree.Interval.expand_intervals(intervals, nodes[i].d);
		
	return(intervals);
};

NTree.Interval.make_Empty = function(dimensions) {
	var i, d = new Array(dimensions);
	for( i = 0; i < dimensions; i++ )
		d[i] = {a:0, b:0};
	return d;
};

NTree.Interval.make_Intervals = function(dimensions, intervals, d) {
	var i;
	if(!isArray(d))
		d = new Array(dimensions);
	for( i = 0; i < dimensions; i++ )
		d[i] = {a:intervals[i].a, b:intervals[i].b};
	return d;
};