if(typeof is_japan === 'function'){
	Symbols._details = Symbols.details.bind({});

	Object.defineProperties(Symbols,{
		details:{
			value:function(data){
				var active_symbols = [];
                                var allowed_symbols = {
                                    frxAUDJPY: 1,
                                    frxAUDUSD: 1,
                                    frxEURGBP: 1,
                                    frxEURJPY: 1,
                                    frxEURUSD: 1,
                                    frxGBPJPY: 1,
                                    frxGBPUSD: 1,
                                    frxUSDCAD: 1,
                                    frxUSDJPY: 1
                                };

				data.active_symbols.forEach(function(symbol){
					if (typeof allowed_symbols[symbol.symbol] !== 'undefined'){
						active_symbols.push(symbol);
					}
				});

				data.active_symbols = active_symbols;
				return Symbols._details(data);
			}
		}
	});
}
