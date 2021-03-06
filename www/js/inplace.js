/*!
 * Inplace - An inplace editor
 *
 * The MIT License
 *
 * @author:  Washington Botelho
 * @doc:     wbotelhos.com/inplace
 * @version: 0.1.0
 *
 */

;
(function($) {
  'use strict';

  $.inplace = {
    buttonOrder:   ['cancel', 'save'],
    cancel:        true,
    cancelClass:   'inplace__cancel',
    cancelValue:   'Cancel',
    checkable:     ['checkbox', 'radio'],
    fieldClass:    'inplace__field',
    fieldName:     undefined,
    fieldTemplate: '{name}',
    fieldType:     'text',
    method:        'PATCH',
    save:          true,
    saveClass:     'inplace__save',
    saveValue:     'Save',
    selectable:    ['select-one', 'select-multiple'],

    typeful: [
      'color',
      'date',
      'datetime',
      'datetime-local',
      'email',
      'hidden',
      'month',
      'number',
      'password',
      'range',
      'search',
      'tel',
      'text',
      'textarea',
      'time',
      'url',
      'week'
    ]
  }

  $.fn.inplace = function(options) {
    return this.each(function() {
      return (new $.inplace.Inplace(this, options))._create();
    });
  }

  $.inplace.Inplace = (function() {
    var Inplace = function(element, options) {
      this.el      = $(element);
      this.element = element;

      var oDisplay = "inline";
      //var oDisplay = $(element).css( "display" );
      //$(element).css( "display", "inline" );
      $(element).after( "&nbsp;<div class=\"glyphicon glyphicon-pencil\" aria-hidden=\"true\" style=\"display: " + oDisplay + "\"></div>" );
      this.pencil_el = $(element).next();
      this.options = $.extend({}, $.inplace, options, this.el.data());
      
    }

    Inplace.prototype = {
      _activate: function() {
        var field = this._field();

	this.pencil_el.off('click.inplace.el' );
	this.pencil_el.hide();

	var a_el = this.el.parent( 'A' );
	if( ! a_el.length )
	{
		this.orig_href = undefined;
		this.orig_a = undefined;
	}
	else
	{
		this.orig_a = a_el;
		this.orig_href = $(a_el).attr("href");
		$(a_el).attr("href",null);
	}

        this
          .el
          .off('click.inplace.el')
          .addClass('inplace--active')
          .html(field)
          .trigger('inplace:activate', this.element);

        for (var i = 0; i < this.options.buttonOrder.length; i++) {
          var value = this.options.buttonOrder[i];

          if (this.options[value]) {
            this._build(value, 'button').appendTo(this.el);
          }
        }

        var actived = $('.inplace--active').not(this.el);

        for (var i = 0; i < actived.length; i++) {
          actived.data('inplace')._deactivate();
        }

        field.trigger('focus');
        //viktor edit - focusing on EOL
        var $initialVal = field.val();
        field.val("");
        field.val($initialVal);
      },

      _bindCancel: function() {
        this.el.on('click.inplace.cancel', '[data-inplace-cancel]', this._deactivate.bind(this));
      },

      _bindClick: function() {
        //this.el.on('click.inplace.el', this._activate.bind(this));
	this.pencil_el.on('click.inplace.el', this._activate.bind(this));
      },

      _bindField: function() {
        var typeful = [];

        for (var i = 0; i < $.inplace.typeful.length; i++) {
          typeful.push('[type="' + $.inplace.typeful[i] + '"]');
        }

        var fields = typeful.join(',');

        this._bindKey('keypress.inplace.field', 13, fields, this._request.bind(this));
        this._bindKey('keyup.inplace.field', 27, fields, this._deactivate.bind(this));
      },

      _bindKey: function(event, keycode, fields, callback) {
        this.el.on(event, fields, function(evt) {
          if ((evt.which || evt.keyCode) === keycode) {
            callback();
          }
        });
      },

      _bindSave: function() {
        this.el.on('click.inplace.save', '[data-inplace-save]', this._request.bind(this));
      },

      _build: function(kind, type) {
        var options = {
          'class': this.options[kind + 'Class'],
          type:    type,
          value:   this.options[kind + 'Value']
        };

        if (kind === 'field') {
          var attributes = this.el.data('attributes');

          if (attributes) {
            options = $.extend({}, options, attributes);
          }
        }

        options['data-inplace-' + kind] = '';

	var newsel = $('<input />', options);
        return newsel;
      },

      _create: function() {
        this._bindClick();
        this._bindField();
        this._bindSave();
        this._bindCancel();

        this.el.data('inplace', this);

        return this;
      },

      _deactivate: function() {
	this.pencil_el.show();
        this._bindClick();

        this
          .el
          .removeClass('inplace--active')
          .html(this.element.getAttribute('data-field-value'))
          .trigger('inplace:deactivate', this.element);

	if( this.orig_a !== undefined )
	{
		$(this.orig_a).attr("href",this.orig_href);
	}
	return false;
      },

      _done: function(json) {
        this.options.fieldValue = json[this.options.fieldName];
        this.element.setAttribute('data-field-value', this.options.fieldValue);
        //deactivate moved down because of losing data
        this._deactivate();
        this.el.trigger('inplace:done', json);
      },

      _field: function() {
        return this._build('field', this.options.fieldType);
      },

      _request: function() {
        $.ajax(this._requestOptions()).done(this._done.bind(this));
      },

      _requestOptions: function() {
        var data = {};
        var name = this.options.fieldTemplate.replace('{name}', this.options.fieldName);

        data[name] = this.el.find('[data-inplace-field]').val();

        return { data: data, method: this.options.method, url: this.options.url };
      }
    };

    return Inplace;
  })();
})(jQuery);
