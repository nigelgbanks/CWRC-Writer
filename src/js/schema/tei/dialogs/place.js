/*jshint browser: true*/
/*global define*/
define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div id="'+id+'_tagAs">'+
            '<p>Tag as:</p>'+
            '<span class="tagAs"></span>'+
        '</div>'+
        '<div id="'+id+'_certainty" data-transform="buttonset" data-type="radio" data-mapping="cert">'+
            '<p>This identification is:</p>'+
            '<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" data-default="true" /><label for="'+id+'_definite">Definite</label>'+
            '<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonably certain" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
            '<input type="radio" id="'+id+'_probable" name="'+id+'_id_certainty" value="probable" /><label for="'+id+'_probable">Probable</label>'+
            '<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
        '</div>'+
        '<div>'+
            '<p>Precision of location of place name:</p>'+
            '<div id="'+id+'_precision" data-transform="buttonset" data-type="radio" data-mapping="custom.precision">'+
                '<input type="radio" id="'+id+'_high" name="'+id+'_detail_radio" value="high" /><label for="'+id+'_high">High</label>'+
                '<input type="radio" id="'+id+'_medium" name="'+id+'_detail_radio" value="medium" /><label for="'+id+'_medium">Medium</label>'+
                '<input type="radio" id="'+id+'_low" name="'+id+'_detail_radio" value="low" /><label for="'+id+'_low">Low</label>'+
                '<input type="radio" id="'+id+'_unknown" name="'+id+'_detail_radio" value="unknown" /><label for="'+id+'_unknown">Unknown</label>'+
            '</div>'+
        '</div>'+
        '<input type="hidden" id="'+id+'_ref" data-type="hidden" data-mapping="ref"/>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        type: 'place',
        title: 'Tag Place',
        height: 350,
        width: 400,
        html: html
    });
    
    dialog.$el.on('beforeShow', function(e, config, dialog) {
        var cwrcInfo = dialog.currentData.cwrcInfo;
        if (cwrcInfo !== undefined) {
            $('#'+id+'_ref').val(cwrcInfo.id);
        }
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});