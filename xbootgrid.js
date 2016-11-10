$.fn.xbootgrid = function(configParam){
	
	var config = {
		ajax: true,
		selection: true,
		multiSelect: true,
		rowSelect: true,
		rowCount:[5, 10, 25, 50, -1],
		keepSelection: true,
		css: {
			icon: 'fa icon',
			iconColumns: 'fa-table',
			iconDown: 'fa-sort-down',
			iconRefresh: 'fa-refresh',
			iconUp: 'fa-sort-up'
		},
		labels: {
			noResults: "Table vide",
			loading: "Chargement en cours...",
			search: "Rechercher",
			infos: "Affichage de {{ctx.start}} à {{ctx.end}} sur un total de {{ctx.total}} entrées"
		},
		widgetOptions:{}
	};
	var formatters = {};
	var handlers = {};
	
	var bootgridGetCellById = function(id,col){
		var index = this.find('> thead > tr > th[data-column-id="'+col+'"]').index();
		return this.find('> tbody > tr[data-row-id="'+id+'"] > td').eq(index).html();
	};
	
	var allColumnIsChecked = function($this,index){
		var check = true;
		$this.find('> tbody > tr').each(function(){
			if(!$(this).find('> td').eq(index).find('input:checkbox').prop('checked')){
				check = false;
				return false;
			}
		});
		return check;
	};
	
	var getThByIndex = function($this,index){
		return $this.find('> thead > tr > th').eq(index).find('input:checkbox');
	};
	
	var getColumnFor = function($this,td){
		return $this.find('> thead > tr > th').eq($(td).index()).attr('data-column-id');
	};
	
	var widgets = {
		logo: {
			formatter:	function(column, row){
				return '<div class="img-circle-48"><img src="'+row[column.id]+'"></div>';
			}
		},
		route: {
			formatter: function(column, row){
				return '<a href="javascript:;">'+row[column.id]+'</a>';
			},
			handler: function(){
				$(this).find('>a').click(function(e){
					var rowId = $(this).closest('tr').data('row-id');
					config.widgetOptions.routeCallback(rowId);
				});
			}
		},
		check: {
			formatter:	function(column, row){
				return '<div class="checkbox"><label><input type="checkbox" name="'+column.id+'" '+(row[column.id]=='1'?'checked="checked"':'')+' autocomplete="off"><i class="input-helper"></i></label></div>';
			},
			handler:	function($this){
				var self = $(this);
				var tr = self.closest('tr');
				var id = tr.data('row-id');
				var checkbox = self.find('input[type=checkbox]');
				var checked = checkbox.prop('checked');
				var index = self.index();
				var thCheckbox = getThByIndex($this,index);
				self.click(function(e){
					e.preventDefault();
					$.post(config.url,{method:'toggle'+checkbox.attr('name'),params:[id,checked?0:1]},function(){
						checked = !checked;
						checkbox.prop('checked',checked);
						
						if(thCheckbox.length){
							if(!checked){
								if(thCheckbox.prop('checked')){
									thCheckbox.prop('checked',false);
								}
							}
							else{
								if(allColumnIsChecked($this,index)){
									thCheckbox.prop('checked',true);
								}
							}
						}
						
					});
				});
				if(tr.is(':last-child')){
					if(allColumnIsChecked($this,index)){
						thCheckbox.prop('checked',true);
					}
				}
			}
		},
		activeread: {
			formatter:	function(column, row) {
				var active = row.active=='1';
				var colorActive = 'green';
				var colorInactive = 'red';
				return '<div class="btn bgm-'+(active?colorActive:colorInactive)+' btn-v-icon"> </div>';
			}
		},
		active: {
			formatter:	function(column, row) {
				return '<div class="toggle-switch"></label><input type="checkbox" autocomplete="off" hidden="hidden" '+(row[column.id]=='1'?'checked="checked"':'')+'><label class="ts-helper"></label></div>';
			},
			handler: function(){
				var colorActive = 'green';
				var colorInactive = 'red';
				var self = $(this);
				var checkbox = self.find('input[type=checkbox]');
				var toggle = self.find('.toggle-switch');
				var active = checkbox.prop('checked');
				var toggleActiveClass = function(){
					if(active){
						toggle.attr('data-ts-color',colorActive);
						checkbox.prop('checked',true);
					}
					else{
						toggle.attr('data-ts-color',colorInactive);
						checkbox.prop('checked',false);
					}
				};
				toggleActiveClass();
				self.click(function(){
					var id = self.closest('tr').data('row-id');
					$.post(config.url,{method:'active',params:[id,active?0:1]},function(){
						active = !active;
						toggleActiveClass();
					});
				});
			}
		},
		dateformat: function(column, row) {
			return date('d/m/Y à H:i',row[column.id]);
		},
		edit: {
			formatter: function(column, row) {
				return '<button type="button" class="btn btn-icon bgm-white"><span class="fa fa-pencil"></span></button>';
			},
			handler: function(){
				$(this).find('>button').click(function(e){
					var rowId = $(this).closest('tr').data('row-id');
					config.widgetOptions.editCallback(rowId);
				});
			}
		},
        select:{
            formatter: function(column, row) {
				var options = '';
				var opts = config.widgetOptions.selectOptions[column.id];
				if(opts instanceof Array){
					var tmp = opts;
					opts = {};
					for(var i = 0; i < tmp.length; i++){
						opts[tmp[i]] = tmp[i];
					}
				}
				for(var k in opts){
					var label;
					var opt = opts[k];
					var option = $('<option></option>')
					option.attr('value',k);
					if(k==row[column.id]){
						option.attr('selected','selected');
					}
					if(typeof(opt)=='string'){
						option.html(opt);
					}
					else{
						for(var attr in opt){
							if(attr=='label'){
								option.html(opt[attr]);
							}
							else{
								option.attr(attr,opt[attr]);
							}
						}
					}
					options += option[0].outerHTML;
				}
                return '<select class="form-control">'+options+'</select>';
            },
            handler: function($this){
				var select = $(this).find('select');
                var columnId = getColumnFor($this,this);
                var change, init;
                if(config.widgetOptions.selectChange){
					change = config.widgetOptions.selectChange[columnId];
				}
				if(config.widgetOptions.selectInit){
					init = config.widgetOptions.selectInit[columnId];
				}
                if(init){
					init.apply(select[0]);
				}
                if(change){
					select.change(change);
				}
            }
        },
		structure: {
			formatter: function(column, row) {
				return '<button type="button" class="btn btn-icon bgm-white"><span class="fa fa-cubes"></span></button>';
			},
			handler: function($this){
				$(this).find('>button').click(function(e){
					var rowId = $(this).closest('tr').data('row-id');
					config.widgetOptions.structureCallback(rowId,$this.bootgridGetCellById(rowId,'name'));
				});
			}
		},
		layoutmaker: {
			formatter: function(column, row) {
				return '<button type="button" class="btn btn-icon bgm-white"><span class="fa fa-object-group"></span></button>';
			},
			handler: function($this){
				$(this).find('>button').click(function(e){
					var rowId = $(this).closest('tr').data('row-id');
					config.widgetOptions.layoutmakerCallback(rowId,$this.bootgridGetCellById(rowId,'name'));
				});
			}
		},
		remove: {
			formatter: function(column, row) {
				return '<button type="button" class="btn bgm-red btn-icon action-delete"><span class="fa fa-trash"></span></button>';
			},
			handler: function($this){
				var id = $(this).closest('tr').data('row-id');
				var btn = $(this).find('>button');
				btn.click(function(e){
					var self = $(this);
					
					var name = $this.bootgridGetCellById(id,config.widgetOptions.removeColumn||'id');
					var title = config.widgetOptions.removeTitle||'Supression de « %s »';
					var body = config.widgetOptions.removeBody||"Êtes-vous sûr de vouloir supprimer « %s » ?";
					var ok = config.widgetOptions.removeOk||'Supprimer';
					
					 BootstrapDialog.show({
						title: title.replace('%s',name),
						message: body.replace('%s',name),
						closable: true,
						buttons: [{
							label: 'Annuler',
							action: function(dialogRef){
								dialogRef.close();
							}
						},{
							label: ok,
							action: function(dialogRef){
								$.ajax({
									method: 'POST',
									url: config.url,
									data: {
										method:'delete',
										params:[id]
									},
									success: function(response){
										if(response.deleted){
											$this.bootgrid('reload',false);
										}
										dialogRef.close();
									}
								});								
							}
						}]
					});
				});
			}
		},
		combine: {
			formatter: function(column, row){
				var html = '';
				var combine = column.data.combine.split(',');
				for(var i = 0; i < combine.length; i++){
					html += formatters[combine[i]]($.extend(true,{},column,{data:{formatter:combine[i]}}),row);
				}
				return html;
			},
			handler: function(){
				
			}
		}
	};
	
	if(config.widgets){
		$.extend(true,widgets,config.widgets);
	}
	for(var k in  widgets){
		if(widgets.hasOwnProperty(k)){
			if(typeof(widgets[k])=='function'){
				formatters[k] = widgets[k];
			}
			else if(typeof(widgets[k])=='object'){
				if(widgets[k].formatter){
					formatters[k] = widgets[k].formatter;
				}
				if(widgets[k].handler){
					handlers[k] = widgets[k].handler;
				}
			}
		}
	}
	
	config.formatters = formatters;
	config = $.extend(true,config,configParam);
	
	var getActionsArea = function($this){
		return $this.prev('.bootgrid-header').find('.actionBar .actions');
	};
	var getSelectedRows = function($this){
		var rows = [];
		$this.find('input[type=checkbox][name=select]:checked').each(function(){
			var rowid = $(this).closest('[data-row-id]').data('row-id');
			if(rowid){
				rows.push(rowid);
			}
		});
		return rows;
	};
	var selectionWidgets = {
		remove:function($this){
			var actions = getActionsArea($this);
			actions.append('<div class=\"btn-group\"><button class="btn btn-default action-delete" title="Supprimer" type="button"><span class="fa fa-trash"></span></button></div>');
			actions.find('.action-delete').click(function(){
				var self = $(this);
				var rows = getSelectedRows($this);
				if(!rows.length)
					return;
				var names = [];
				for(var i = 0, length = rows.length; i < length; i++){
					names.push( $this.bootgridGetCellById(rows[i],config.widgetOptions.removeColumn||'id') );
				}			
				names = names.join('», «');
				var title = config.widgetOptions.removeTitle||'Supression multiple';
				var body = config.widgetOptions.removeBody||"Êtes-vous sûr de vouloir supprimer « %s » ?";
				var ok = config.widgetOptions.removeOk||'Supprimer';
				
				BootstrapDialog.show({
					title: title.replace('%s',name),
					message: body.replace('%s',name),
					closable: true,
					buttons: [{
						label: 'Annuler',
						action: function(dialogRef){
							dialogRef.close();
						}
					},{
						label: ok,
						action: function(dialogRef){
							$.ajax({
								method: 'POST',
								url: config.url,
								data: {
									method:'deletes',
									params:[rows]
								},
								success: function(response){
									if(response.deleted){
										$this.bootgrid('reload',false);
									}
									dialogRef.close();
								}
							});								
						}
					}]
				});
			});
		}
	};
	
	return this.each(function(index){
		var $this = $(this);
		$this.bootgridGetCellById = bootgridGetCellById;
		
		//nav pagination
		var pageKey = 'page-'+$this.getId();
		var current = jstack.route.getSubParam(pageKey)||1;
		var elementConfig = $.extend(true,{},config, {current:current} );
		$(window).on('subHashchange',function(){
			var currentPage = jstack.route.getSubParam(pageKey)||1;
			if(currentPage!=current){
				current = currentPage;
				$this.bootgrid('setCurrent',currentPage);
				$this.bootgrid('reload',false);
			}
		});
		
		$this.on('loaded.rs.jquery.bootgrid', function(e){
			
			//nav pagination
			var currentPage = $this.bootgrid('getCurrentPage')||1;
			if(currentPage!=current){
				current = currentPage;
				jstack.route.setSubHash(pageKey+'='+currentPage);
			}
			
			$this.find('> thead > tr > th[data-handler][data-handler!=""]').each(function(){
				var self = $(this);
				var dHandler = self.attr('data-handler');
				dHandler = dHandler.split(',');
				for(var i = 0, length = dHandler.length; i < length; i++){
					var handler = dHandler[i];
					if(!handlers[handler]) return;
					var index = self.index();
					$this.find('tr').each(function(){
						$(this).find('td').eq(index).each(function(){
							handlers[handler].call(this,$this);
						});
					});
				}
			});
			if(config.selection&&$this.find('.action-delete').length&&!getActionsArea($this).find('.action-delete').length){
				selectionWidgets.remove($this);
			}
		});
		$this.bootgrid(elementConfig);
		
	});	
};